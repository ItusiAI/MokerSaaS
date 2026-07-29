import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, referrals, referralHistory } from '@/lib/schema'
import { eq, and, desc, sum } from 'drizzle-orm'
import { getOrCreateReferralCode } from '@/lib/referral'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // 获取或创建用户的推荐码
    const referralCode = await getOrCreateReferralCode(userId)

    // 读取是否还能修改一次（未修改过为可编辑）
    const userFlag = await db
      .select({ referralCodeChanged: users.referralCodeChanged })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    const canEdit = !userFlag[0]?.referralCodeChanged

    // 获取总邀请人数
    const totalReferralsResult = await db
      .select({ count: referrals.id })
      .from(referrals)
      .where(eq(referrals.referrerId, userId))

    // 获取已订阅的邀请人数
    const subscribedReferralsResult = await db
      .select({ count: referrals.id })
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerId, userId),
          eq(referrals.hasSubscribed, true)
        )
      )

    // 获取总积分奖励（从推荐历史中统计）
    const totalPointsResult = await db
      .select({
        total: sum(referralHistory.pointsAwarded)
      })
      .from(referralHistory)
      .where(eq(referralHistory.userId, userId))

    const totalPointsEarned = Number(totalPointsResult[0]?.total || 0)

    // 获取被推荐用户列表（最近5个）
    const referralRecords = await db
      .select({
        id: referrals.id,
        referredId: referrals.referredId,
        referralCode: referrals.referralCode,
        hasSubscribed: referrals.hasSubscribed,
        createdAt: referrals.createdAt,
        referredUserEmail: users.email,
        referredUserName: users.name,
        referredUserImage: users.image,
      })
      .from(referrals)
      .innerJoin(users, eq(referrals.referredId, users.id))
      .where(eq(referrals.referrerId, userId))
      .orderBy(desc(referrals.createdAt))
      .limit(5)

    return NextResponse.json({
      success: true,
      stats: {
        referralCode,
        canEdit,
        totalReferrals: totalReferralsResult.length,
        subscribedReferrals: subscribedReferralsResult.length,
        totalPointsEarned,
        referralRecords,
      },
    })
  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

