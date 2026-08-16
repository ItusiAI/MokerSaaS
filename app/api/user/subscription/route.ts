import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, pointsHistory } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      )
    }

    // 获取用户完整信息（包括积分信息）
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

    // 检查订阅是否已到期
    const now = new Date()
    const isExpired = user.subscriptionCurrentPeriodEnd && user.subscriptionCurrentPeriodEnd < now
    const hasActiveSubscription = user.subscriptionStatus === 'active' && !isExpired

    // 如果订阅已到期但状态仍为active，需要更新状态并清零赠送积分
    if (isExpired && user.subscriptionStatus === 'active' && (user.giftedPoints || 0) > 0) {
      console.log('检测到订阅已到期，清零赠送积分:', {
        userId: user.id,
        到期时间: user.subscriptionCurrentPeriodEnd,
        当前时间: now,
        当前赠送积分: user.giftedPoints
      })

      // 清零赠送积分并更新订阅状态
      await db
        .update(users)
        .set({
          subscriptionStatus: 'expired',
          subscriptionPlan: null,
          points: sql`${users.points} - ${user.giftedPoints || 0}`,
          giftedPoints: 0,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))

      // 记录积分清零历史
      await db.insert(pointsHistory).values({
        id: uuidv4(),
        userId: user.id,
        points: -(user.giftedPoints || 0),
        pointsType: 'gifted',
        action: 'subscription_expired',
        description: `订阅到期自动清零赠送积分`,
        createdAt: new Date(),
      })

      console.log(`订阅到期处理完成: 用户 ${user.id}，清零 ${user.giftedPoints || 0} 赠送积分`)

      // 返回更新后的状态
      return NextResponse.json({
        subscriptionStatus: 'expired',
        subscriptionPlan: null,
        subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd?.toISOString() || null,
        stripeCustomerId: user.stripeCustomerId,
        hasTrialSubscription: user.hasTrialSubscription || false,
      })
    }

    // 如果订阅已到期但没有赠送积分需要清零，只更新状态
    if (isExpired && user.subscriptionStatus === 'active') {
      await db
        .update(users)
        .set({
          subscriptionStatus: 'expired',
          subscriptionPlan: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))

      console.log(`订阅到期状态更新: 用户 ${user.id}，无赠送积分需要清零`)

      return NextResponse.json({
        subscriptionStatus: 'expired',
        subscriptionPlan: null,
        subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd?.toISOString() || null,
        stripeCustomerId: user.stripeCustomerId,
        hasTrialSubscription: user.hasTrialSubscription || false,
      })
    }

    // 返回当前状态
    return NextResponse.json({
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd?.toISOString() || null,
      stripeCustomerId: user.stripeCustomerId,
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