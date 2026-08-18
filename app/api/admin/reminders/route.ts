import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { subscriptionReminders, users } from '@/lib/schema'
import { eq, desc, like, or, count, and, sql } from 'drizzle-orm'
import { isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const adminAccess = await isAdmin()
  if (!adminAccess) {
    return NextResponse.json({ error: 'admin_required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const search = (searchParams.get('search') || '').trim()
  const reminderType = (searchParams.get('reminderType') || '').trim()
  const locale = (searchParams.get('locale') || '').trim()

  const where: any[] = [];
  if (search) {
    where.push(
      or(
        like(users.email, `%${search}%`),
        like(users.name, `%${search}%`),
      ),
    )
  }
  if (reminderType && ['7d', '3d', 'today'].includes(reminderType)) {
    where.push(eq(subscriptionReminders.reminderType, reminderType))
  }
  if (locale && ['en', 'zh', 'ja', 'ko', 'tw'].includes(locale)) {
    where.push(eq(subscriptionReminders.locale, locale))
  }

  const whereExpr = where.length ? and(...where) : undefined

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: subscriptionReminders.id,
        userId: subscriptionReminders.userId,
        userEmail: users.email,
        userName: users.name,
        reminderType: subscriptionReminders.reminderType,
        sentAt: subscriptionReminders.sentAt,
        periodEnd: subscriptionReminders.periodEnd,
        subject: subscriptionReminders.subject,
        locale: subscriptionReminders.locale,
        plan: subscriptionReminders.plan,
        emailMessageId: subscriptionReminders.emailMessageId,
      })
      .from(subscriptionReminders)
      .leftJoin(users, eq(subscriptionReminders.userId, users.id))
      .where(whereExpr)
      .orderBy(desc(subscriptionReminders.sentAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ total: count() })
      .from(subscriptionReminders)
      .leftJoin(users, eq(subscriptionReminders.userId, users.id))
      .where(whereExpr),
  ])

  // 顶部统计（按类型分组，不受筛选影响）
  const statsRows = await db
    .select({
      reminderType: subscriptionReminders.reminderType,
      total: count(),
    })
    .from(subscriptionReminders)
    .groupBy(subscriptionReminders.reminderType)

  const stats = {
    total: 0,
    '7d': 0,
    '3d': 0,
    today: 0,
  }
  for (const r of statsRows) {
    stats[r.reminderType as '7d' | '3d' | 'today'] = r.total
    stats.total += r.total
  }

  return NextResponse.json({
    rows,
    pagination: {
      page,
      limit,
      total: totalRow[0]?.total ?? 0,
      totalPages: Math.max(1, Math.ceil((totalRow[0]?.total ?? 0) / limit)),
    },
    stats,
  })
}