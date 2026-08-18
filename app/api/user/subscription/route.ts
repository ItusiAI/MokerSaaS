import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { expireSubscriptionIfNeeded } from '@/lib/subscription'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      )
    }

    // 入口拦截:统一处理过期检测 + 清零赠送积分
    await expireSubscriptionIfNeeded(session.user.id)

    // 重新读取 fresh 状态
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        id: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionCurrentPeriodEnd: true,
        stripeCustomerId: true,
        points: true,
        giftedPoints: true,
        purchasedPoints: true,
        hasTrialSubscription: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'user_not_found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd?.toISOString() || null,
      stripeCustomerId: user.stripeCustomerId,
      points: user.points,
      giftedPoints: user.giftedPoints,
      purchasedPoints: user.purchasedPoints,
      hasTrialSubscription: user.hasTrialSubscription || false,
    })
  } catch (error) {
    console.error('获取订阅信息失败:', error)
    return NextResponse.json(
      { error: 'server_error' },
      { status: 500 }
    )
  }
}