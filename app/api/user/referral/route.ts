import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOrCreateReferralCode, getReferralStats } from '@/lib/referral'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      )
    }

    // 获取或创建推荐码
    const referralCode = await getOrCreateReferralCode(session.user.id)
    
    // 获取推荐统计
    const stats = await getReferralStats(session.user.id)

    // 构建推荐链接
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const referralLink = `${baseUrl}/auth/signup?ref=${referralCode}`

    return NextResponse.json({
      success: true,
      referralCode,
      referralLink,
      stats: {
        totalReferrals: stats.totalReferrals,
        subscribedReferrals: stats.subscribedReferrals,
        history: stats.history,
        referralRecords: stats.referralRecords,
      },
    })
  } catch (error) {
    console.error('获取推荐信息失败:', error)
    return NextResponse.json(
      { error: 'server_error' },
      { status: 500 }
    )
  }
}

