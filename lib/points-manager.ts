import { db } from '@/lib/db'
import { users, pointsHistory } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

// 积分使用策略：优先使用赠送积分，再使用购买积分
export async function usePoints(
  userId: string,
  pointsToUse: number,
  description: string,
  action: string = 'use'
) {
  try {
    // 获取用户当前积分信息
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    
    if (user.length === 0) {
      throw new Error('用户不存在')
    }

    const currentUser = user[0]
    const totalPoints = currentUser.points || 0
    const giftedPoints = currentUser.giftedPoints || 0
    const purchasedPoints = currentUser.purchasedPoints || 0

    if (totalPoints < pointsToUse) {
      throw new Error('积分不足')
    }

    let remainingPointsToUse = pointsToUse
    let giftedPointsUsed = 0
    let purchasedPointsUsed = 0

    // 优先使用赠送积分
    if (giftedPoints > 0 && remainingPointsToUse > 0) {
      giftedPointsUsed = Math.min(giftedPoints, remainingPointsToUse)
      remainingPointsToUse -= giftedPointsUsed
    }

    // 如果还有剩余需要扣除的积分，使用购买积分
    if (remainingPointsToUse > 0) {
      purchasedPointsUsed = remainingPointsToUse
    }

    // 更新用户积分
    await db
      .update(users)
      .set({
        points: sql`${users.points} - ${pointsToUse}`,
        giftedPoints: sql`${users.giftedPoints} - ${giftedPointsUsed}`,
        purchasedPoints: sql`${users.purchasedPoints} - ${purchasedPointsUsed}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    // 记录积分使用历史
    if (giftedPointsUsed > 0) {
      await db.insert(pointsHistory).values({
        id: uuidv4(),
        userId,
        points: -giftedPointsUsed,
        pointsType: 'gifted',
        action,
        description: description,
        createdAt: new Date(),
      })
    }

    if (purchasedPointsUsed > 0) {
      await db.insert(pointsHistory).values({
        id: uuidv4(),
        userId,
        points: -purchasedPointsUsed,
        pointsType: 'purchased',
        action,
        description: description,
        createdAt: new Date(),
      })
    }

    return {
      success: true,
      pointsUsed: pointsToUse,
      giftedPointsUsed,
      purchasedPointsUsed,
      remainingPoints: totalPoints - pointsToUse,
    }
  } catch (error) {
    console.error('积分使用失败:', error)
    throw error
  }
}

// 获取用户积分详情
export async function getUserPointsDetail(userId: string) {
  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    
    if (user.length === 0) {
      throw new Error('用户不存在')
    }

    const currentUser = user[0]
    
    // 检查订阅是否已到期并处理积分清零
    const now = new Date()
    const isExpired = currentUser.subscriptionCurrentPeriodEnd && currentUser.subscriptionCurrentPeriodEnd < now
    let totalPoints = currentUser.points || 0
    let giftedPoints = currentUser.giftedPoints || 0
    let subscriptionStatus = currentUser.subscriptionStatus
    let subscriptionPlan = currentUser.subscriptionPlan

    // 如果订阅已到期但状态仍为active，需要清零赠送积分
    if (isExpired && currentUser.subscriptionStatus === 'active' && (currentUser.giftedPoints || 0) > 0) {
      console.log('积分详情API检测到订阅已到期，清零赠送积分:', {
        userId: currentUser.id,
        到期时间: currentUser.subscriptionCurrentPeriodEnd,
        当前时间: now,
        当前赠送积分: currentUser.giftedPoints
      })

      // 清零赠送积分并更新订阅状态
      await db
        .update(users)
        .set({
          subscriptionStatus: 'expired',
          subscriptionPlan: null,
          points: sql`${users.points} - ${currentUser.giftedPoints || 0}`,
          giftedPoints: 0,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))

      // 记录积分清零历史
      await db.insert(pointsHistory).values({
        id: uuidv4(),
        userId: currentUser.id,
        points: -(currentUser.giftedPoints || 0),
        pointsType: 'gifted',
        action: 'subscription_expired',
        description: `订阅到期自动清零赠送积分`,
        createdAt: new Date(),
      })

      // 更新返回值
      totalPoints = totalPoints - (currentUser.giftedPoints || 0)
      giftedPoints = 0
      subscriptionStatus = 'expired'
      subscriptionPlan = null

      console.log(`积分详情API订阅到期处理完成: 用户 ${currentUser.id}，清零 ${currentUser.giftedPoints || 0} 赠送积分`)
    }
    
    return {
      totalPoints,
      purchasedPoints: currentUser.purchasedPoints || 0,
      giftedPoints,
      subscriptionStatus,
      subscriptionPlan,
      subscriptionCurrentPeriodEnd: currentUser.subscriptionCurrentPeriodEnd,
    }
  } catch (error) {
    console.error('获取用户积分详情失败:', error)
    throw error
  }
}

// 管理员手动添加积分
export async function addPointsManually(userId: string, points: number, type: 'purchased' | 'gifted', description: string) {
  try {
    // 更新用户积分
    if (type === 'purchased') {
      await db
        .update(users)
        .set({
          points: sql`${users.points} + ${points}`,
          purchasedPoints: sql`${users.purchasedPoints} + ${points}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
    } else {
      await db
        .update(users)
        .set({
          points: sql`${users.points} + ${points}`,
          giftedPoints: sql`${users.giftedPoints} + ${points}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
    }

    // 记录积分历史
    await db.insert(pointsHistory).values({
      id: uuidv4(),
      userId,
      points,
      pointsType: type,
      action: 'manual',
      description,
      createdAt: new Date(),
    })

    return {
      success: true,
      pointsAdded: points,
      type,
    }
  } catch (error) {
    console.error('手动添加积分失败:', error)
    throw error
  }
} 