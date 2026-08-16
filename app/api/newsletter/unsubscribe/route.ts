import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { newsletterSubscriptions } from '@/lib/schema'
import { eq } from 'drizzle-orm'
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
    const token = body?.token
    const locale = pickLocale(body?.locale)
    const t = await getTranslations({ locale, namespace: 'newsletter' })

    if (!email && !token) {
      return NextResponse.json({ error: t('missing_input') }, { status: 400 })
    }

    let whereCondition
    if (token) {
      whereCondition = eq(newsletterSubscriptions.unsubscribeToken, token)
    } else {
      whereCondition = eq(newsletterSubscriptions.email, email)
    }

    // 查找订阅记录
    const existingSubscription = await db
      .select()
      .from(newsletterSubscriptions)
      .where(whereCondition)
      .limit(1)

    if (existingSubscription.length === 0) {
      return NextResponse.json({ error: t('not_found') }, { status: 404 })
    }

    const subscription = existingSubscription[0]

    if (!subscription.isActive) {
      return NextResponse.json({ message: t('already_unsubscribed') }, { status: 200 })
    }

    // 取消订阅
    await db
      .update(newsletterSubscriptions)
      .set({
        isActive: false,
        unsubscribedAt: new Date(),
      })
      .where(whereCondition)

    return NextResponse.json({ message: t('unsubscribed') })
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET请求用于通过链接取消订阅
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const locale = pickLocale(searchParams.get('locale'))
    const t = await getTranslations({ locale, namespace: 'newsletter' })

    if (!token) {
      return NextResponse.json({ error: t('invalid_link') }, { status: 400 })
    }

    // 查找订阅记录
    const existingSubscription = await db
      .select()
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.unsubscribeToken, token))
      .limit(1)

    if (existingSubscription.length === 0) {
      return NextResponse.json({ error: t('not_found') }, { status: 404 })
    }

    const subscription = existingSubscription[0]

    if (!subscription.isActive) {
      return NextResponse.json({ message: t('already_unsubscribed') }, { status: 200 })
    }

    // 取消订阅
    await db
      .update(newsletterSubscriptions)
      .set({
        isActive: false,
        unsubscribedAt: new Date(),
      })
      .where(eq(newsletterSubscriptions.unsubscribeToken, token))

    return NextResponse.json({ message: t('unsubscribed') })
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
