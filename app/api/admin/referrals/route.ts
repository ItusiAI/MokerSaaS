import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { referrals, users, referralHistory } from '@/lib/schema'
import { eq, desc, like, or, count, sum } from 'drizzle-orm'
import { isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminAccess = await isAdmin()
    if (!adminAccess) {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    if (action === 'stats') {
      // 获取推荐统计数据
      const [totalReferrals, subscribedReferrals, totalPoints] = await Promise.all([
        db.select({ count: count() }).from(referrals),
        db.select({ count: count() }).from(referrals).where(eq(referrals.hasSubscribed, true)),
        db.select({ total: sum(referralHistory.pointsAwarded) }).from(referralHistory)
      ])

      return NextResponse.json({
        totalReferrals: totalReferrals[0]?.count || 0,
        subscribedReferrals: subscribedReferrals[0]?.count || 0,
        totalPointsAwarded: Number(totalPoints[0]?.total || 0),
      })
    }

    if (action === 'records') {
      // 获取推荐记录列表
      const offset = (page - 1) * limit

      const records = await db
        .select({
          id: referrals.id,
          referrerId: referrals.referrerId,
          referredId: referrals.referredId,
          referralCode: referrals.referralCode,
          hasSubscribed: referrals.hasSubscribed,
          subscriptionRewarded: referrals.subscriptionRewarded,
          createdAt: referrals.createdAt,
        })
        .from(referrals)
        .orderBy(desc(referrals.createdAt))
        .limit(limit)
        .offset(offset)

      // 获取推荐人和被推荐人信息
      const recordsWithUserInfo = await Promise.all(
        records.map(async (record) => {
          const [referrer, referred] = await Promise.all([
            db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, record.referrerId)).limit(1),
            db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, record.referredId)).limit(1),
          ])

          return {
            ...record,
            referrerName: referrer[0]?.name || null,
            referrerEmail: referrer[0]?.email || null,
            referredName: referred[0]?.name || null,
            referredEmail: referred[0]?.email || null,
          }
        })
      )

      // 获取总数
      const totalRecords = await db.select({ count: count() }).from(referrals)

      return NextResponse.json({
        records: recordsWithUserInfo,
        pagination: {
          page,
          limit,
          total: totalRecords[0]?.count || 0,
          totalPages: Math.ceil((totalRecords[0]?.count || 0) / limit),
        },
      })
    }

    if (action === 'rewards') {
      // 获取推荐奖励记录
      const offset = (page - 1) * limit

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
        })
        .from(referralHistory)
        .orderBy(desc(referralHistory.createdAt))
        .limit(limit)
        .offset(offset)

      // 获取用户信息
      const rewardsWithUserInfo = await Promise.all(
        rewards.map(async (reward) => {
          const user = await db
            .select({
              name: users.name,
              email: users.email,
            })
            .from(users)
            .where(eq(users.id, reward.userId))
            .limit(1)

          // 获取推荐关系信息
          let referredUser = null
          if (reward.referralId) {
            const referral = await db
              .select({
                referredId: referrals.referredId,
              })
              .from(referrals)
              .where(eq(referrals.id, reward.referralId))
              .limit(1)

            if (referral[0]?.referredId) {
              const referred = await db
                .select({
                  name: users.name,
                  email: users.email,
                })
                .from(users)
                .where(eq(users.id, referral[0].referredId))
                .limit(1)
              referredUser = referred[0] || null
            }
          }

          return {
            ...reward,
            userName: user[0]?.name || null,
            userEmail: user[0]?.email || null,
            referredUserName: referredUser?.name || null,
            referredUserEmail: referredUser?.email || null,
          }
        })
      )

      // 获取总数
      const totalRewards = await db.select({ count: count() }).from(referralHistory)

      return NextResponse.json({
        rewards: rewardsWithUserInfo,
        pagination: {
          page,
          limit,
          total: totalRewards[0]?.count || 0,
          totalPages: Math.ceil((totalRewards[0]?.count || 0) / limit),
        },
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in admin referrals API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

