import { db } from '@/lib/db'
import { users, pointsHistory, subscriptionReminders } from '@/lib/schema'
import { eq, and, isNotNull, lt, gte, sql } from 'drizzle-orm'
import crypto from 'crypto'

// ============================================================
// 单用户过期检测 + 清零赠送积分
//  - 10 秒内存缓存（避免同一请求链多次查询）
//  - 乐观并发：UPDATE WHERE status='active'（防双写）
//  - 只清零 giftedPoints，purchasedPoints 不动
// ============================================================

const CACHE_TTL_MS = 10_000
const checkCache = new Map<string, { checkedAt: number; expired: boolean }>()

function getCached(uid: string): boolean | null {
  const e = checkCache.get(uid)
  if (!e) return null
  if (Date.now() - e.checkedAt > CACHE_TTL_MS) {
    checkCache.delete(uid)
    return null
  }
  return e.expired
}

function setCached(uid: string, expired: boolean) {
  checkCache.set(uid, { checkedAt: Date.now(), expired })
}

export interface SubscriptionSnapshot {
  subscriptionStatus: string | null
  subscriptionPlan: string | null
  subscriptionCurrentPeriodEnd: Date | null
}

export function isSubscriptionActive(user: SubscriptionSnapshot): boolean {
  return (
    user.subscriptionStatus === 'active' &&
    user.subscriptionCurrentPeriodEnd !== null &&
    user.subscriptionCurrentPeriodEnd > new Date()
  )
}

/**
 * 单用户过期检测 + 清零赠送积分
 *  - 10 秒内存缓存
 *  - 乐观并发:UPDATE WHERE status='active'
 *  - 清零 giftedPoints,不动 purchasedPoints
 */
export async function expireSubscriptionIfNeeded(userId: string): Promise<boolean> {
  const cached = getCached(userId)
  if (cached !== null) return cached

  const result = await db
    .select({
      id: users.id,
      subscriptionStatus: users.subscriptionStatus,
      subscriptionCurrentPeriodEnd: users.subscriptionCurrentPeriodEnd,
      giftedPoints: users.giftedPoints,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const u = result[0]
  if (!u) {
    setCached(userId, false)
    return false
  }

  const isExpired =
    u.subscriptionStatus === 'active' &&
    u.subscriptionCurrentPeriodEnd !== null &&
    u.subscriptionCurrentPeriodEnd < new Date()

  if (!isExpired) {
    setCached(userId, false)
    return false
  }

  // 乐观并发:只有当 status 仍为 active 时才清零
  const updateResult = await db
    .update(users)
    .set({
      subscriptionStatus: 'expired',
      subscriptionPlan: null,
      giftedPoints: 0,
      points: sql`${users.points} - COALESCE(${u.giftedPoints ?? 0}, 0)`,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, userId), eq(users.subscriptionStatus, 'active')))
    .returning({ id: users.id })

  const wasUpdated = updateResult.length > 0

  if (wasUpdated && (u.giftedPoints ?? 0) > 0) {
    const { nanoid } = await import('nanoid')
    await db.insert(pointsHistory).values({
      id: nanoid(),
      userId,
      points: -(u.giftedPoints ?? 0),
      pointsType: 'gifted',
      action: 'subscription_expired',
      description: '订阅到期自动清零赠送积分',
      createdAt: new Date(),
    })
    console.log(`[subscription] 用户 ${userId} 订阅到期,清零 ${u.giftedPoints} 赠送积分`)
  }

  setCached(userId, true)
  return true
}

// ============================================================
// 全表扫过期（cron 任务 1 用）
// ============================================================

export async function expireAllOverdueSubscriptions(): Promise<{ scanned: number; expired: number }> {
  const now = new Date()
  const candidates = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.subscriptionStatus, 'active'),
        isNotNull(users.subscriptionCurrentPeriodEnd),
        lt(users.subscriptionCurrentPeriodEnd, now),
      ),
    )

  let expiredCount = 0
  for (const c of candidates) {
    checkCache.delete(c.id)
    if (await expireSubscriptionIfNeeded(c.id)) expiredCount++
  }

  console.log(
    `[subscription] expire 任务:候选 ${candidates.length},实际处理 ${expiredCount}`,
  )
  return { scanned: candidates.length, expired: expiredCount }
}

// ============================================================
// 到期前提醒窗口扫描（cron 任务 2/3/4 用）
// ============================================================

export type ReminderType = '7d' | '3d' | 'today'

export const REMINDER_WINDOWS: Array<{ type: ReminderType; daysAhead: number }> = [
  { type: '7d', daysAhead: 7 },
  { type: '3d', daysAhead: 3 },
  { type: 'today', daysAhead: 0 },
]

/**
 * 计算 X 天后到期的窗口
 *  - daysAhead=0  →  [今天 00:00 UTC, 明天 00:00 UTC)  ±12h
 * 用 ±12h 吸收 Vercel Hobby cron ±59min 精度误差
 */
function getWindowBounds(daysAhead: number, baseDate: Date = new Date()): [Date, Date] {
  const start = new Date(baseDate)
  start.setUTCHours(0, 0, 0, 0)
  start.setUTCDate(start.getUTCDate() + daysAhead)
  const windowStart = new Date(start.getTime() - 12 * 60 * 60 * 1000)
  const windowEnd = new Date(start.getTime() + 12 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000)
  return [windowStart, windowEnd]
}

/**
 * 找出指定到期窗口内、未退订、未发送过该类型提醒的用户
 */
export async function findUsersForReminder(
  daysAhead: number,
  type: ReminderType,
): Promise<Array<{ user: typeof users.$inferSelect; periodEnd: Date }>> {
  const [ws, we] = getWindowBounds(daysAhead)

  const candidates = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.subscriptionStatus, 'active'),
        eq(users.subscriptionReminderDisabled, false),
        isNotNull(users.subscriptionCurrentPeriodEnd),
        gte(users.subscriptionCurrentPeriodEnd, ws),
        lt(users.subscriptionCurrentPeriodEnd, we),
      ),
    )

  const result: Array<{ user: typeof users.$inferSelect; periodEnd: Date }> = []
  for (const u of candidates) {
    if (!u.subscriptionCurrentPeriodEnd) continue
    const periodEnd = u.subscriptionCurrentPeriodEnd

    // 双重去重:SQL 过滤 + 表日志检查(防 cron 重复触发)
    const alreadySent = await db
      .select({ id: subscriptionReminders.id })
      .from(subscriptionReminders)
      .where(
        and(
          eq(subscriptionReminders.userId, u.id),
          eq(subscriptionReminders.periodEnd, periodEnd),
          eq(subscriptionReminders.reminderType, type),
        ),
      )
      .limit(1)

    if (alreadySent.length === 0) {
      result.push({ user: u, periodEnd })
    }
  }
  return result
}

/** 记录已发送(用于幂等) */
export async function markReminderSent(
  userId: string,
  periodEnd: Date,
  type: ReminderType,
  emailMessageId?: string,
  meta?: { subject?: string; locale?: string; plan?: string },
): Promise<void> {
  const { nanoid } = await import('nanoid')
  await db
    .insert(subscriptionReminders)
    .values({
      id: nanoid(),
      userId,
      periodEnd,
      reminderType: type,
      sentAt: new Date(),
      emailMessageId: emailMessageId ?? null,
      subject: meta?.subject ?? null,
      locale: meta?.locale ?? null,
      plan: meta?.plan ?? null,
    })
    .onConflictDoNothing()
}

export function clearSubscriptionCache() {
  checkCache.clear()
}

// ============================================================
// 退订 Token 工具
// ============================================================

export function generateUnsubscribeToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/** 确保用户有退订 token(老用户首次扫描时回填) */
export async function ensureUnsubscribeToken(userId: string): Promise<string> {
  const result = await db
    .select({ token: users.subscriptionUnsubscribeToken })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const existing = result[0]?.token
  if (existing) return existing

  const newToken = generateUnsubscribeToken()
  await db
    .update(users)
    .set({ subscriptionUnsubscribeToken: newToken })
    .where(eq(users.id, userId))

  return newToken
}

// ============================================================
// 语言工具
// ============================================================

export const SUPPORTED_LOCALES = ['en', 'zh', 'ja', 'ko', 'tw'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export function pickLocale(input: string | null | undefined): SupportedLocale {
  if (input && (SUPPORTED_LOCALES as readonly string[]).includes(input)) {
    return input as SupportedLocale
  }
  return 'en'
}