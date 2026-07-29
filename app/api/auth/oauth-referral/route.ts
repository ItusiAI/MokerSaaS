import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, referrals } from '@/lib/schema'
import { eq, and, gte } from 'drizzle-orm'
import {
  findReferrerByCode,
  createReferralRelation,
  checkIfAlreadyReferred,
  awardRegistrationBonus,
} from '@/lib/referral'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { referralCode } = await request.json()

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      )
    }

    const userId = session.user.id

    // 检查用户是否是新注册的（创建时间在最近5分钟内）
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 检查用户是否是新注册的（创建时间在最近5分钟内）
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const isNewUser = user.createdAt && new Date(user.createdAt) >= fiveMinutesAgo

    if (!isNewUser) {
      return NextResponse.json(
        { error: 'Referral code can only be applied for new registrations' },
        { status: 400 }
      )
    }

    // 检查用户是否已被邀请
    const alreadyReferred = await checkIfAlreadyReferred(userId)
    if (alreadyReferred) {
      return NextResponse.json(
        { error: 'User has already been referred' },
        { status: 400 }
      )
    }

    // 验证推荐码
    const referrerId = await findReferrerByCode(referralCode.trim())
    if (!referrerId) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 400 }
      )
    }

    // 不能自己推荐自己
    if (referrerId === userId) {
      return NextResponse.json(
        { error: 'Cannot use your own referral code' },
        { status: 400 }
      )
    }

    // 创建邀请关系
    const referralId = await createReferralRelation(
      referrerId,
      userId,
      referralCode.trim()
    )

    // 给新用户和邀请人发放注册奖励（各100积分，永久有效）
    await awardRegistrationBonus(userId, referralId, referrerId)

    return NextResponse.json({
      success: true,
      message: 'Referral relationship created successfully'
    })

  } catch (error) {
    console.error('OAuth referral processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process referral' },
      { status: 500 }
    )
  }
}

