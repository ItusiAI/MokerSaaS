import { NextRequest, NextResponse } from 'next/server'
import {
  REMINDER_WINDOWS,
  expireAllOverdueSubscriptions,
  findUsersForReminder,
  markReminderSent,
  clearSubscriptionCache,
  ensureUnsubscribeToken,
  pickLocale,
  SUPPORTED_LOCALES,
} from '@/lib/subscription'
import { sendSubscriptionReminder } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * Cron 任务 - 订阅过期清零 + 到期提醒
 *  - 路径：/api/cron/expire-subscriptions
 *  - 调度：每天 13:00 UTC (北京时间 21:00)
 *  - 鉴权：Authorization: Bearer ${CRON_SECRET}
 *  - Dry run:?dry=1
 */
export async function GET(request: NextRequest) {
  // 1. 鉴权
  const authHeader = request.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const dryRun = new URL(request.url).searchParams.get('dry') === '1'
  clearSubscriptionCache()

  const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const result: Record<string, any> = { success: true, dryRun, timestamp: new Date().toISOString(), tasks: {} }

  // 2. 任务 1:清零已过期订阅
  try {
    if (dryRun) {
      // dry 模式下只统计,不修改
      const { db } = await import('@/lib/db')
      const { users } = await import('@/lib/schema')
      const { and, eq, isNotNull, lt, sql } = await import('drizzle-orm')
      const now = new Date()
      const count = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          and(
            eq(users.subscriptionStatus, 'active'),
            isNotNull(users.subscriptionCurrentPeriodEnd),
            lt(users.subscriptionCurrentPeriodEnd, now),
          ),
        )
      result.tasks.expire = { scanned: count[0]?.count ?? 0, expired: 0, dryRun: true }
    } else {
      result.tasks.expire = await expireAllOverdueSubscriptions()
    }
  } catch (err) {
    console.error('[cron] expire 任务失败:', err)
    result.tasks.expire = { error: 'failed', message: String(err) }
  }

  // 3. 任务 2/3/4:邮件提醒(7d / 3d / today)
  for (const w of REMINDER_WINDOWS) {
    try {
      const targets = await findUsersForReminder(w.daysAhead, w.type)
      let sent = 0
      let failed = 0
      const errors: any[] = []

      for (const { user, periodEnd } of targets) {
        if (dryRun) {
          sent++
          continue
        }
        try {
          const token = await ensureUnsubscribeToken(user.id)
          const locale = pickLocale(user.preferredLanguage)
          const unsubscribeUrl = `${base}/${locale}/subscription/unsubscribe?token=${token}`
          const renewUrl = `${base}/${locale}/pricing`

          const sendResult = await sendSubscriptionReminder({
            to: user.email,
            name: user.name,
            plan: user.subscriptionPlan ?? 'subscription',
            type: w.type,
            locale: user.preferredLanguage,
            unsubscribeUrl,
            renewUrl,
          })

          if (sendResult.success) {
            await markReminderSent(
              user.id,
              periodEnd,
              w.type,
              sendResult.messageId,
              {
                subject: sendResult.subject,
                locale,
                plan: user.subscriptionPlan ?? 'subscription',
              },
            )
            sent++
          } else {
            failed++
            errors.push({ userId: user.id, error: sendResult.error })
          }
        } catch (e) {
          console.error(`[cron] ${w.type} 邮件失败 uid=${user.id}:`, e)
          failed++
          errors.push({ userId: user.id, error: String(e) })
        }
      }

      result.tasks[`remind_${w.type}`] = {
        candidates: targets.length,
        sent,
        failed,
        ...(errors.length > 0 ? { sampleErrors: errors.slice(0, 3) } : {}),
      }
    } catch (err) {
      console.error(`[cron] ${w.type} 扫描失败:`, err)
      result.tasks[`remind_${w.type}`] = { error: 'failed', message: String(err) }
    }
  }

  console.log('[cron] expire-subscriptions 完成:', JSON.stringify(result.tasks))
  return NextResponse.json(result)
}