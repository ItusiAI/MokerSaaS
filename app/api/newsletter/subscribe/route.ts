import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { newsletterSubscriptions } from '@/lib/schema'
import { eq, desc, count } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import crypto from 'crypto'
import { isAdmin } from '@/lib/auth-utils'
import { getTranslations } from 'next-intl/server'

const SUPPORTED_LOCALES = ['en', 'zh', 'ja', 'ko', 'tw'] as const
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

function pickLocale(input: unknown): SupportedLocale {
  if (typeof input === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(input)) {
    return input as SupportedLocale
  }
  return 'en'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body?.email
    const locale = pickLocale(body?.locale)
    const t = await getTranslations({ locale, namespace: 'newsletter' })

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: t('invalid_email') }, { status: 400 })
    }

    // 检查是否已经订阅
    const existingSubscription = await db
      .select()
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.email, email))
      .limit(1)

    if (existingSubscription.length > 0) {
      const subscription = existingSubscription[0]

      // 如果已经是活跃订阅
      if (subscription.isActive) {
        return NextResponse.json({ message: t('already_subscribed') }, { status: 200 })
      }

      // 重新激活订阅
      await db
        .update(newsletterSubscriptions)
        .set({
          isActive: true,
          subscribedAt: new Date(),
          unsubscribedAt: null,
          locale: locale,
        })
        .where(eq(newsletterSubscriptions.email, email))

      return NextResponse.json({ message: t('resubscribed') })
    }

    // 创建新订阅
    const subscriptionId = nanoid()
    const unsubscribeToken = crypto.randomBytes(32).toString('hex')

    await db.insert(newsletterSubscriptions).values({
      id: subscriptionId,
      email: email,
      locale: locale,
      unsubscribeToken: unsubscribeToken,
    })

    // TODO: 这里可以发送欢迎邮件
    // await sendWelcomeEmail(email, locale, unsubscribeToken)

    return NextResponse.json({ message: t('subscribed') })
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // 获取订阅统计信息（仅用于管理）
  try {
    // 验证管理员权限
    const adminAccess = await isAdmin()
    if (!adminAccess) {
      return NextResponse.json({ error: 'admin_required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'stats') {
      const totalSubscriptions = await db
        .select()
        .from(newsletterSubscriptions)
        .where(eq(newsletterSubscriptions.isActive, true))

      const counts = totalSubscriptions.reduce<Record<string, number>>((acc, sub) => {
        const loc = (sub.locale as string) || 'en'
        acc[loc] = (acc[loc] || 0) + 1
        return acc
      }, {})

      return NextResponse.json({
        total: totalSubscriptions.length,
        zh: counts.zh || 0,
        en: counts.en || 0,
        ja: counts.ja || 0,
        ko: counts.ko || 0,
      })
    }

    if (action === 'list') {
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
      const filter = (searchParams.get('filter') || '').trim() // 'active' | 'inactive' | ''

      const whereClause = filter === 'active'
        ? eq(newsletterSubscriptions.isActive, true)
        : filter === 'inactive'
        ? eq(newsletterSubscriptions.isActive, false)
        : undefined

      const baseQuery = db
        .select({
          id: newsletterSubscriptions.id,
          email: newsletterSubscriptions.email,
          locale: newsletterSubscriptions.locale,
          isActive: newsletterSubscriptions.isActive,
          subscribedAt: newsletterSubscriptions.subscribedAt,
          unsubscribedAt: newsletterSubscriptions.unsubscribedAt,
        })
        .from(newsletterSubscriptions)
        .orderBy(desc(newsletterSubscriptions.subscribedAt))
        .limit(limit)
        .offset((page - 1) * limit)

      const rows = whereClause
        ? await baseQuery.where(whereClause)
        : await baseQuery

      const totalRow = await db
        .select({ total: count() })
        .from(newsletterSubscriptions)
        .where(whereClause ?? undefined)
      const total = totalRow[0]?.total ?? 0

      return NextResponse.json({
        subscriptions: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Newsletter stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
