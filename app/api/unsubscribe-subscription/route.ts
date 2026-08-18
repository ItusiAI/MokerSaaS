import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'
import { pickLocale } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

/**
 * GET:点邮件链接直接退订 + 跳转结果页
 *   URL: /api/unsubscribe-subscription?token=xxx&locale=zh
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const locale = pickLocale(searchParams.get('locale'))
  const t = await getTranslations({ locale, namespace: 'subscription.reminder.unsubscribe.api' })

  if (!token) {
    return NextResponse.json({ error: t('invalid_link') }, { status: 400 })
  }

  const result = await db
    .select({
      id: users.id,
      disabled: users.subscriptionReminderDisabled,
    })
    .from(users)
    .where(eq(users.subscriptionUnsubscribeToken, token))
    .limit(1)

  if (result.length === 0) {
    return NextResponse.json({ error: t('not_found') }, { status: 404 })
  }

  if (!result[0].disabled) {
    await db
      .update(users)
      .set({ subscriptionReminderDisabled: true, updatedAt: new Date() })
      .where(eq(users.id, result[0].id))
  }

  return NextResponse.redirect(
    new URL(`/${locale}/subscription/unsubscribe?token=${token}`, request.url),
    { status: 302 },
  )
}

/**
 * POST:供 UnsubscribeForm 页面调用(已退订用户进入页面可以"恢复订阅提醒")
 *   body: { token, action: 'unsubscribe' | 'resubscribe', locale }
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const token = body?.token as string | undefined
  const action = body?.action as string | undefined
  const locale = pickLocale(body?.locale as string | null | undefined)
  const t = await getTranslations({ locale, namespace: 'subscription.reminder.unsubscribe.api' })

  if (!token) {
    return NextResponse.json({ error: t('invalid_link') }, { status: 400 })
  }

  const result = await db
    .select({
      id: users.id,
      disabled: users.subscriptionReminderDisabled,
    })
    .from(users)
    .where(eq(users.subscriptionUnsubscribeToken, token))
    .limit(1)

  if (result.length === 0) {
    return NextResponse.json({ error: t('not_found') }, { status: 404 })
  }

  const shouldDisable = action !== 'resubscribe'
  const user = result[0]

  if (shouldDisable !== user.disabled) {
    await db
      .update(users)
      .set({ subscriptionReminderDisabled: shouldDisable, updatedAt: new Date() })
      .where(eq(users.id, user.id))
  }

  // 幂等友好:已退订再发 unsubscribe 不报错
  const message =
    action === 'resubscribe' && !user.disabled
      ? t('already_unsubscribed')
      : shouldDisable
        ? t('unsubscribed')
        : t('resubscribed')

  return NextResponse.json({
    success: true,
    isUnsubscribed: shouldDisable,
    message,
  })
}