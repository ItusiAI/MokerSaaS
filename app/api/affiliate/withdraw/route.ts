import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOrCreateAffiliateProfile, createWithdrawal } from '@/lib/affiliate'
import { sendWithdrawRequestAdminEmail } from '@/lib/email'

function normalizeAppLocale(input: unknown, fallback: 'en' | 'zh-CN' | 'ja' | 'ko' | 'zh-TW' = 'en'): 'en' | 'zh-CN' | 'ja' | 'ko' | 'zh-TW' {
  if (typeof input === 'string' && (['en', 'zh-CN', 'ja', 'ko', 'zh-TW'] as const).includes(input as any)) {
    return input as 'en' | 'zh-CN' | 'ja' | 'ko' | 'zh-TW'
  }
  return fallback
}

/**
 * 创建提现申请
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      )
    }

    const { amount, paymentMethod, accountName, accountInfo, locale } = await request.json()

    // 验证输入
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'INVALID_AMOUNT' },
        { status: 400 }
      )
    }

    if (!paymentMethod || typeof paymentMethod !== 'string') {
      return NextResponse.json(
        { error: 'INVALID_PAYMENT_METHOD' },
        { status: 400 }
      )
    }

    if (!accountName || typeof accountName !== 'string' || !accountName.trim()) {
      return NextResponse.json(
        { error: 'INVALID_ACCOUNT_NAME' },
        { status: 400 }
      )
    }

    if (!accountInfo || typeof accountInfo !== 'string' || !accountInfo.trim()) {
      return NextResponse.json(
        { error: 'INVALID_ACCOUNT_INFO' },
        { status: 400 }
      )
    }

    // 转换为美分（前端传的是美元，转换为美分）
    const amountInCents = Math.floor(amount * 100)

    // 获取推广资料ID
    const profileId = await getOrCreateAffiliateProfile(session.user.id)

    // 获取当前可用余额
    const { db } = await import('@/lib/db')
    const { affiliateProfiles } = await import('@/lib/schema')
    const { eq } = await import('drizzle-orm')
    
    const profile = await db
      .select()
      .from(affiliateProfiles)
      .where(eq(affiliateProfiles.id, profileId))
      .limit(1)

    if (profile.length === 0) {
      return NextResponse.json(
        { error: 'PROFILE_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 检查金额是否超过可用余额
    if (amountInCents > profile[0].balance) {
      return NextResponse.json(
        { error: 'INSUFFICIENT_BALANCE' },
        { status: 400 }
      )
    }

    // 创建提现申请
    const result = await createWithdrawal(
      profileId,
      amountInCents,
      paymentMethod,
      accountName.trim(),
      accountInfo.trim()
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'WITHDRAWAL_FAILED' },
        { status: 400 }
      )
    }

    // 发送管理员提现通知邮件（异步，不影响主流程）
    try {
      const userEmail = session.user.email || ''
      const userName = session.user.name || ''

      if (userEmail) {
        await sendWithdrawRequestAdminEmail({
          userName,
          userEmail,
          amountInCents,
          paymentMethod,
          accountName: accountName.trim(),
          accountInfo: accountInfo.trim(),
          requestedAt: new Date(),
          locale: normalizeAppLocale(locale, 'en'),
        })
      }
    } catch (notifyError) {
      console.error('Failed to send admin withdraw notification email:', notifyError)
    }

    return NextResponse.json({
      success: true,
      withdrawalId: result.withdrawalId,
    })
  } catch (error) {
    console.error('Failed to create withdrawal:', error)
    return NextResponse.json(
      { error: 'WITHDRAWAL_FAILED' },
      { status: 500 }
    )
  }
}

