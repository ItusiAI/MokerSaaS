import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, pointsHistory } from '@/lib/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { isAdmin } from '@/lib/auth-utils'
import { v4 as uuidv4 } from 'uuid'
import { getSubscriptionGiftedPoints } from '@/lib/points'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // 验证管理员权限
    const adminAccess = await isAdmin()
    if (!adminAccess) {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      )
    }

    const { userId } = await params

    // 获取用户详细信息
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (user.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 获取用户积分历史
    const pointsHistoryData = await db
      .select()
      .from(pointsHistory)
      .where(eq(pointsHistory.userId, userId))
      .orderBy(desc(pointsHistory.createdAt))
      .limit(20)

    return NextResponse.json({
      user: user[0],
      pointsHistory: pointsHistoryData
    })
  } catch (error) {
    console.error('Get user details error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // 验证管理员权限
    const adminAccess = await isAdmin()
    if (!adminAccess) {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      )
    }

    const { userId } = await params
    const { action, ...data } = await request.json()

    if (action === 'updateRole') {
      const { role } = data
      
      if (!['user', 'admin'].includes(role)) {
        return NextResponse.json(
          { error: '无效的用户角色' },
          { status: 400 }
        )
      }

      const result = await db
        .update(users)
        .set({ 
          role,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning()

      if (result.length === 0) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        message: '用户角色更新成功',
        user: result[0]
      })
    }

    if (action === 'adjustPoints') {
      const { points, pointsType = 'purchased', description } = data
      
      if (!points || isNaN(points)) {
        return NextResponse.json(
          { error: '积分数量无效' },
          { status: 400 }
        )
      }

      // 获取当前用户信息
      const currentUser = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (currentUser.length === 0) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        )
      }

      const user = currentUser[0]
      const pointsChange = parseInt(points)

      // 如果是赠送积分，必须关联订阅到期时间
      if (pointsType === 'gifted' && pointsChange > 0) {
        if (!user.subscriptionCurrentPeriodEnd) {
          return NextResponse.json(
            { error: '赠送积分必须关联订阅到期时间，请先为用户设置订阅' },
            { status: 400 }
          )
        }
        // 检查订阅是否已过期
        const now = new Date()
        if (user.subscriptionCurrentPeriodEnd < now) {
          return NextResponse.json(
            { error: '用户订阅已过期，无法添加赠送积分。请先更新订阅到期时间' },
            { status: 400 }
          )
        }
      }

      // 计算新的积分值
      let newTotalPoints = (user.points || 0) + pointsChange
      let newPurchasedPoints = user.purchasedPoints || 0
      let newGiftedPoints = user.giftedPoints || 0

      if (pointsType === 'purchased') {
        newPurchasedPoints += pointsChange
      } else {
        newGiftedPoints += pointsChange
        // 如果是扣除赠送积分，确保不超过当前赠送积分数量
        if (pointsChange < 0 && Math.abs(pointsChange) > (user.giftedPoints || 0)) {
          return NextResponse.json(
            { error: '扣除的赠送积分不能超过当前赠送积分数量' },
            { status: 400 }
          )
        }
      }

      // 确保积分不为负数
      if (newTotalPoints < 0) {
        return NextResponse.json(
          { error: '积分不足，无法扣除' },
          { status: 400 }
        )
      }

      // 更新用户积分
      const updatedUser = await db
        .update(users)
        .set({
          points: newTotalPoints,
          purchasedPoints: Math.max(0, newPurchasedPoints),
          giftedPoints: Math.max(0, newGiftedPoints),
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning()

      // 记录积分变动历史
      await db.insert(pointsHistory).values({
        id: uuidv4(),
        userId,
        points: pointsChange,
        pointsType,
        action: 'manual',
        description: description || `管理员${pointsChange > 0 ? '增加' : '扣除'}${pointsType === 'purchased' ? '购买' : '赠送'}积分`,
        createdAt: new Date()
      })

      return NextResponse.json({
        message: '积分调整成功',
        user: updatedUser[0]
      })
    }

    if (action === 'updateSubscription') {
      const { subscriptionStatus, subscriptionPlan, subscriptionEndDate } = data
      
      // 验证订阅状态
      if (subscriptionStatus && !['active', 'cancelled', 'past_due', 'paused'].includes(subscriptionStatus)) {
        return NextResponse.json(
          { error: '无效的订阅状态' },
          { status: 400 }
        )
      }

      // 验证订阅计划
      if (subscriptionPlan && !['trial', 'pro', 'annual'].includes(subscriptionPlan)) {
        return NextResponse.json(
          { error: '无效的订阅计划' },
          { status: 400 }
        )
      }

      // 构建更新数据
      const updateData: any = {
        updatedAt: new Date()
      }

      if (subscriptionStatus) {
        updateData.subscriptionStatus = subscriptionStatus
      }

      if (subscriptionPlan) {
        updateData.subscriptionPlan = subscriptionPlan
      }

      if (subscriptionEndDate) {
        updateData.subscriptionCurrentPeriodEnd = new Date(subscriptionEndDate)
      }

      // 更新用户订阅信息
      const updatedUser = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning()

      // 如果激活订阅，给用户赠送积分
      if (subscriptionStatus === 'active' && subscriptionPlan && ['trial', 'pro', 'annual'].includes(subscriptionPlan)) {
        const giftPoints = getSubscriptionGiftedPoints(subscriptionPlan as 'trial' | 'pro' | 'annual')
        
        // 更新用户积分
        await db
          .update(users)
          .set({
            points: sql`${users.points} + ${giftPoints}`,
            giftedPoints: sql`${users.giftedPoints} + ${giftPoints}`,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId))

        // 记录积分变动历史
        await db.insert(pointsHistory).values({
          id: uuidv4(),
          userId,
          points: giftPoints,
          pointsType: 'gifted',
          action: 'subscription_gift',
          description: `管理员激活${subscriptionPlan}订阅，赠送${giftPoints}积分`,
          createdAt: new Date()
        })
      }

      return NextResponse.json({
        message: '订阅信息更新成功',
        user: updatedUser[0]
      })
    }

    return NextResponse.json(
      { error: '无效的操作类型' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
