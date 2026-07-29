import { db } from '@/lib/db'
import { users, referrals, referralHistory, pointsHistory } from '@/lib/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { getSubscriptionGiftedPoints } from '@/lib/points'

/**
 * 生成唯一的推荐码
 */
export async function generateReferralCode(userId: string): Promise<string> {
  let code: string = ''
  let isUnique = false
  let attempts = 0
  const maxAttempts = 10

  // 尝试生成唯一推荐码
  while (!isUnique && attempts < maxAttempts) {
    // 生成8位随机码（使用大写字母和数字）
    code = nanoid(8).toUpperCase()
    
    // 检查是否已存在
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, code))
      .limit(1)

    if (existing.length === 0) {
      isUnique = true
    }
    attempts++
  }

  if (!isUnique || !code) {
    // 如果无法生成唯一码，使用userId + 随机后缀
    code = `REF${userId.slice(0, 5).toUpperCase()}${nanoid(3).toUpperCase()}`
  }

  // 更新用户的推荐码
  await db
    .update(users)
    .set({ referralCode: code })
    .where(eq(users.id, userId))

  return code
}

/**
 * 获取用户的推荐码（如果不存在则生成）
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const user = await db
    .select({ referralCode: users.referralCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (user[0]?.referralCode) {
    return user[0].referralCode
  }

  return await generateReferralCode(userId)
}

/**
 * 通过推荐码查找邀请者
 */
export async function findReferrerByCode(
  referralCode: string
): Promise<string | null> {
  const user = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.referralCode, referralCode))
    .limit(1)

  return user[0]?.id || null
}

/**
 * 创建邀请关系
 */
export async function createReferralRelation(
  referrerId: string,
  referredId: string,
  referralCode: string
): Promise<string> {
  const referralId = nanoid()

  await db.insert(referrals).values({
    id: referralId,
    referrerId,
    referredId,
    referralCode,
    hasSubscribed: false,
    subscriptionRewarded: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return referralId
}

/**
 * 检查用户是否已被邀请
 */
export async function checkIfAlreadyReferred(
  userId: string
): Promise<boolean> {
  const existing = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referredId, userId))
    .limit(1)

  return existing.length > 0
}

/**
 * 给新注册用户和邀请人发放注册奖励（各100积分，永久有效）
 */
export async function awardRegistrationBonus(
  userId: string,
  referralId: string,
  referrerId: string
): Promise<void> {
  // 给新用户发放100积分（永久有效）
  await db
    .update(users)
    .set({
      purchasedPoints: sql`${users.purchasedPoints} + 100`,
      points: sql`${users.points} + 100`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  // 给邀请人发放100积分（永久有效）
  await db
    .update(users)
    .set({
      purchasedPoints: sql`${users.purchasedPoints} + 100`,
      points: sql`${users.points} + 100`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, referrerId))

  // 记录新用户的积分历史
  const newUserPointsHistoryId = nanoid()
  await db.insert(pointsHistory).values({
    id: newUserPointsHistoryId,
    userId,
    points: 100,
    pointsType: 'purchased',
    action: 'referral',
    createdAt: new Date(),
  })

  // 记录邀请人的积分历史
  const referrerPointsHistoryId = nanoid()
  await db.insert(pointsHistory).values({
    id: referrerPointsHistoryId,
    userId: referrerId,
    points: 100,
    pointsType: 'purchased',
    action: 'referral',
    createdAt: new Date(),
  })

  // 记录新用户的邀请历史
  const newUserHistoryId = nanoid()
  await db.insert(referralHistory).values({
    id: newUserHistoryId,
    userId,
    referralId,
    action: 'register_bonus',
    pointsAwarded: 100,
    createdAt: new Date(),
  })

  // 记录邀请人的邀请历史
  const referrerHistoryId = nanoid()
  await db.insert(referralHistory).values({
    id: referrerHistoryId,
    userId: referrerId,
    referralId,
    action: 'referrer_bonus',
    pointsAwarded: 100,
    createdAt: new Date(),
  })
}

/**
 * 给邀请者发放订阅返利（延长指定天数的订阅，并尽量与被邀请者保持同等订阅类型）
 */
export async function awardSubscriptionReward(
  referrerId: string,
  referralId: string,
  subscriptionDays: number,
  subscriptionPlan: string
): Promise<void> {
  const user = await db
    .select({
      id: users.id,
      email: users.email,
      subscriptionCurrentPeriodEnd: users.subscriptionCurrentPeriodEnd,
      subscriptionStatus: users.subscriptionStatus,
    })
    .from(users)
    .where(eq(users.id, referrerId))
    .limit(1)

  if (!user[0]) {
    return
  }

  // 计算新的订阅结束时间
  let newEndDate: Date
  const hasActiveSubscription = user[0].subscriptionStatus === 'active' &&
                                user[0].subscriptionCurrentPeriodEnd &&
                                user[0].subscriptionCurrentPeriodEnd > new Date()

  if (hasActiveSubscription) {
    // 如果有活跃订阅，在现有到期时间基础上延长
    newEndDate = new Date(user[0].subscriptionCurrentPeriodEnd!.getTime() + subscriptionDays * 24 * 60 * 60 * 1000)
  } else {
    // 如果没有活跃订阅，从当前时间开始计算
    newEndDate = new Date(Date.now() + subscriptionDays * 24 * 60 * 60 * 1000)
  }

  // 根据订阅版本获取对应赠送积分
  const giftedPoints = getSubscriptionGiftedPoints(subscriptionPlan as any)

  // 更新订阅结束时间、状态，并赠送对应订阅版本的积分
  await db
    .update(users)
    .set({
      subscriptionStatus: 'active',
      // 邀请奖励与被邀请者保持同等订阅类型（trial / pro / annual / enterprise）
      subscriptionPlan,
      subscriptionCurrentPeriodEnd: newEndDate,
      points: sql`${users.points} + ${giftedPoints}`,
      giftedPoints: sql`${users.giftedPoints} + ${giftedPoints}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, referrerId))

  // 更新邀请关系状态
  // 注意：每次被邀请人订阅都会发放奖励（不限次数），所以这里只更新 hasSubscribed
  await db
    .update(referrals)
    .set({
      hasSubscribed: true,
      subscriptionRewarded: true, // 标记已发放过奖励（但不影响后续发放）
      updatedAt: new Date(),
    })
    .where(eq(referrals.id, referralId))

  // 记录邀请历史
  const historyId = nanoid()
  await db.insert(referralHistory).values({
    id: historyId,
    userId: referrerId,
    referralId,
    action: 'subscription_reward',
    subscriptionDaysExtended: subscriptionDays,
    pointsAwarded: giftedPoints,
    createdAt: new Date(),
  })

  // 记录积分历史
  await db.insert(pointsHistory).values({
    id: nanoid(),
    userId: referrerId,
    points: giftedPoints,
    pointsType: 'gifted',
    action: 'subscription_reward',
    description: `Referral subscription reward: ${subscriptionDays} days extension + ${giftedPoints} points`,
    createdAt: new Date(),
  })
}

/**
 * 处理被邀请用户的订阅事件
 * @param userId 被邀请用户的ID
 * @param subscriptionDays 订阅时长（天数）
 * @param subscriptionPlan 订阅类型（trial / pro / annual / enterprise 等）
 */
export async function handleReferredUserSubscription(
  userId: string,
  subscriptionDays: number,
  subscriptionPlan: string
): Promise<void> {
  // 查找该用户的邀请关系（不检查 hasSubscribed，因为每次订阅都要赠送）
  const referral = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referredId, userId))
    .limit(1)

  if (referral.length === 0) {
    return // 没有邀请关系
  }

  const referralRecord = referral[0]

  // 检查邀请时效性：如果邀请超过30天，则不进行赠送
  const referralCreatedAt = referralRecord.createdAt
  if (!referralCreatedAt) {
    return
  }

  const now = new Date()
  const daysSinceReferral = Math.floor((now.getTime() - referralCreatedAt.getTime()) / (24 * 60 * 60 * 1000))

  if (daysSinceReferral > 30) {
    return
  }

  // 给邀请者发放奖励（同等时长 & 同等订阅类型）
  await awardSubscriptionReward(
    referralRecord.referrerId,
    referralRecord.id,
    subscriptionDays,
    subscriptionPlan
  )

  // 更新邀请关系状态（标记已订阅，但不影响后续订阅的奖励）
  await db
    .update(referrals)
    .set({
      hasSubscribed: true,
      updatedAt: new Date(),
    })
    .where(eq(referrals.id, referralRecord.id))
}

/**
 * 获取用户的推荐统计
 */
export async function getReferralStats(userId: string) {
  // 获取总邀请人数
  const totalReferrals = await db
    .select({ count: referrals.id })
    .from(referrals)
    .where(eq(referrals.referrerId, userId))

  // 获取已订阅的邀请人数
  const subscribedReferrals = await db
    .select({ count: referrals.id })
    .from(referrals)
    .where(
      and(
        eq(referrals.referrerId, userId),
        eq(referrals.hasSubscribed, true)
      )
    )

  // 获取邀请历史记录
  const history = await db
    .select()
    .from(referralHistory)
    .where(eq(referralHistory.userId, userId))
    .orderBy(desc(referralHistory.createdAt))

  // 获取被推荐用户列表（推荐记录）
  const referralRecords = await db
    .select({
      id: referrals.id,
      referredId: referrals.referredId,
      referralCode: referrals.referralCode,
      hasSubscribed: referrals.hasSubscribed,
      subscriptionRewarded: referrals.subscriptionRewarded,
      createdAt: referrals.createdAt,
      // 被推荐用户信息
      referredUserEmail: users.email,
      referredUserName: users.name,
      referredUserImage: users.image,
      referredUserSubscriptionStatus: users.subscriptionStatus,
    })
    .from(referrals)
    .innerJoin(users, eq(referrals.referredId, users.id))
    .where(eq(referrals.referrerId, userId))
    .orderBy(desc(referrals.createdAt))

  return {
    totalReferrals: totalReferrals.length,
    subscribedReferrals: subscribedReferrals.length,
    history,
    referralRecords,
  }
}

