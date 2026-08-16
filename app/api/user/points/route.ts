import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, pointsHistory } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    // 验证用户登录状态
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'not_logged_in_alt' },
        { status: 401 }
      )
    }

    // 查找用户完整信息（包括订阅信息）
    const userList = await db
      .select({
        id: users.id,
        points: users.points,
        giftedPoints: users.giftedPoints,
        purchasedPoints: users.purchasedPoints,
        name: users.name,
        email: users.email,
        subscriptionStatus: users.subscriptionStatus,
        subscriptionCurrentPeriodEnd: users.subscriptionCurrentPeriodEnd,
        subscriptionPlan: users.subscriptionPlan,
      })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1)

    const user = userList[0]
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'user_not_found' },
        { status: 404 }
      )
    }

    // 检查订阅是否已到期并处理积分清零
    const now = new Date()
    const isExpired = user.subscriptionCurrentPeriodEnd && user.subscriptionCurrentPeriodEnd < now
    let currentPoints = user.points || 0

    // 如果订阅已到期但状态仍为active，需要清零赠送积分
    if (isExpired && user.subscriptionStatus === 'active' && (user.giftedPoints || 0) > 0) {
      console.log('积分API检测到订阅已到期，清零赠送积分:', {
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

      // 更新当前积分值
      currentPoints = currentPoints - (user.giftedPoints || 0)

      console.log(`积分API订阅到期处理完成: 用户 ${user.id}，清零 ${user.giftedPoints || 0} 赠送积分`)
    }

    return NextResponse.json({
      success: true,
      data: {
        points: currentPoints,
        userId: user.id,
        name: user.name,
        email: user.email
      }
    })

  } catch (error) {
    console.error('获取用户积分失败:', error)
    return NextResponse.json(
      { success: false, error: 'server_internal_error' },
      { status: 500 }
    )
  }
}
