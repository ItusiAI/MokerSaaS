import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { referralHistory, referrals, users } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // 获取推荐历史记录（赠送记录），关联推荐关系和被推荐用户信息
    const rewards = await db
      .select({
        id: referralHistory.id,
        userId: referralHistory.userId,
        referralId: referralHistory.referralId,
        action: referralHistory.action,
        description: referralHistory.description,
        pointsAwarded: referralHistory.pointsAwarded,
        subscriptionDaysExtended: referralHistory.subscriptionDaysExtended,
        createdAt: referralHistory.createdAt,
        // 关联推荐关系信息
        referralCode: referrals.referralCode,
        referredId: referrals.referredId,
        // 关联被推荐用户信息
        referredUserEmail: users.email,
        referredUserName: users.name,
      })
      .from(referralHistory)
      .leftJoin(referrals, eq(referralHistory.referralId, referrals.id))
      .leftJoin(users, eq(referrals.referredId, users.id))
      .where(eq(referralHistory.userId, userId))
      .orderBy(desc(referralHistory.createdAt))
      .limit(limit)
      .offset(offset)

    // 获取总数
    const totalRewards = await db
      .select({ count: referralHistory.id })
      .from(referralHistory)
      .where(eq(referralHistory.userId, userId))

    return NextResponse.json({
      success: true,
      data: rewards,
      pagination: {
        page,
        limit,
        total: totalRewards.length,
        totalPages: Math.ceil(totalRewards.length / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching referral rewards:', error)
    return NextResponse.json(
      { error: 'failed_to_get_referral_rewards' },
      { status: 500 }
    )
  }
}

