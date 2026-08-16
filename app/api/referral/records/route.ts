import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, referrals } from '@/lib/schema'
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

    // 获取被推荐用户列表（带分页）
    const referralRecords = await db
      .select({
        id: referrals.id,
        referredId: referrals.referredId,
        referralCode: referrals.referralCode,
        hasSubscribed: referrals.hasSubscribed,
        subscriptionRewarded: referrals.subscriptionRewarded,
        createdAt: referrals.createdAt,
        referredUserEmail: users.email,
        referredUserName: users.name,
        referredUserImage: users.image,
        referredUserSubscriptionStatus: users.subscriptionStatus,
      })
      .from(referrals)
      .innerJoin(users, eq(referrals.referredId, users.id))
      .where(eq(referrals.referrerId, userId))
      .orderBy(desc(referrals.createdAt))
      .limit(limit)
      .offset(offset)

    // 获取总数
    const totalRecords = await db
      .select({ count: referrals.id })
      .from(referrals)
      .where(eq(referrals.referrerId, userId))

    return NextResponse.json({
      success: true,
      data: referralRecords,
      pagination: {
        page,
        limit,
        total: totalRecords.length,
        totalPages: Math.ceil(totalRecords.length / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching referral records:', error)
    return NextResponse.json(
      { error: 'failed_to_get_referral_records' },
      { status: 500 }
    )
  }
}

