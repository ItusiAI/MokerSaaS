import { db } from '@/lib/db'
import { affiliateProfiles, affiliateRelations, affiliateEarnings, affiliateWithdrawals, users } from '@/lib/schema'
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'

/**
 * 创建或获取推广人资料
 * 处理并发请求的竞态条件：如果插入时发生唯一约束冲突，重新查询并返回
 */
export async function getOrCreateAffiliateProfile(userId: string): Promise<string> {
  // 检查是否已存在推广资料
  const existing = await db
    .select()
    .from(affiliateProfiles)
    .where(eq(affiliateProfiles.userId, userId))
    .limit(1)

  if (existing.length > 0) {
    return existing[0].id
  }

  // 生成唯一的推广码
  let code: string = ''
  let isUnique = false
  let attempts = 0
  const maxAttempts = 10

  while (!isUnique && attempts < maxAttempts) {
    // 生成8位随机码（使用大小写字母和数字）
    code = nanoid(8)
    
    // 检查是否已存在
    const existingCode = await db
      .select()
      .from(affiliateProfiles)
      .where(eq(affiliateProfiles.code, code))
      .limit(1)

    if (existingCode.length === 0) {
      isUnique = true
    }
    attempts++
  }

  if (!isUnique || !code) {
    // 如果无法生成唯一码，使用userId + 随机后缀
    code = `AFF${userId.slice(0, 5)}${nanoid(3)}`
  }

  // 创建推广资料
  // 使用 try-catch 处理并发请求导致的唯一约束冲突
  try {
    const profileId = nanoid()
    await db.insert(affiliateProfiles).values({
      id: profileId,
      userId,
      code,
      codeChanged: false,
      balance: 0,
      frozenBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return profileId
  } catch (error: any) {
    // 如果是唯一约束冲突（userId 或 code），重新查询并返回
    // PostgreSQL 错误代码：23505 = unique_violation
    if (error?.code === '23505' || error?.cause?.code === '23505') {
      // 重新查询，可能另一个并发请求已经创建了
      const retryExisting = await db
        .select()
        .from(affiliateProfiles)
        .where(eq(affiliateProfiles.userId, userId))
        .limit(1)

      if (retryExisting.length > 0) {
        return retryExisting[0].id
      }

      // 如果重新查询仍然没有找到，可能是 code 冲突，尝试使用备用方案
      // 使用 userId + 时间戳生成唯一码
      const fallbackCode = `AFF${userId.slice(0, 5)}${Date.now().toString(36).slice(-3)}`
      
      try {
        const profileId = nanoid()
        await db.insert(affiliateProfiles).values({
          id: profileId,
          userId,
          code: fallbackCode,
          codeChanged: false,
          balance: 0,
          frozenBalance: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        return profileId
      } catch (fallbackError: any) {
        // 如果备用方案也失败，最后一次查询
        const finalRetry = await db
          .select()
          .from(affiliateProfiles)
          .where(eq(affiliateProfiles.userId, userId))
          .limit(1)

        if (finalRetry.length > 0) {
          return finalRetry[0].id
        }

        // 如果所有尝试都失败，抛出错误
        throw new Error(`Failed to create affiliate profile for user ${userId}: ${fallbackError.message}`)
      }
    }

    // 其他错误直接抛出
    throw error
  }
}

/**
 * 更新推广码（只能修改一次）
 * 与推荐码更新逻辑保持一致
 */
export async function updateAffiliateCode(
  userId: string,
  newCode: string
): Promise<{ success: boolean; error?: string; code?: string }> {
  // 验证推广码格式（4-20个字符，仅支持字母和数字，与推荐码格式一致）
  if (!newCode || typeof newCode !== 'string') {
    return { success: false, error: 'INVALID_FORMAT' }
  }

  const code = newCode.trim()
  
  // 验证长度和格式
  if (code.length < 4 || code.length > 20) {
    return { success: false, error: 'INVALID_FORMAT' }
  }

  if (!/^[A-Za-z0-9]+$/.test(code)) {
    return { success: false, error: 'INVALID_FORMAT' }
  }

  // 获取推广资料
  const [currentProfile] = await db
    .select()
    .from(affiliateProfiles)
    .where(eq(affiliateProfiles.userId, userId))
    .limit(1)

  if (!currentProfile) {
    return { success: false, error: 'PROFILE_NOT_FOUND' }
  }

  // 仅允许修改一次
  if (currentProfile.codeChanged) {
    return { success: false, error: 'CODE_ALREADY_CHANGED' }
  }

  // 检查推广码是否已被使用
  const [existingCode] = await db
    .select()
    .from(affiliateProfiles)
    .where(eq(affiliateProfiles.code, code))
    .limit(1)

  if (existingCode) {
    return { success: false, error: 'CODE_ALREADY_TAKEN' }
  }

  // 更新推广码，并标记已修改过一次
  await db
    .update(affiliateProfiles)
    .set({ 
      code: code,
      codeChanged: true,
      updatedAt: new Date()
    })
    .where(eq(affiliateProfiles.userId, userId))

  return { success: true, code: code }
}

/**
 * 通过推广码查找推广人
 */
export async function findAffiliateByCode(
  affiliateCode: string
): Promise<{ profileId: string; userId: string } | null> {
  const profile = await db
    .select({
      id: affiliateProfiles.id,
      userId: affiliateProfiles.userId,
    })
    .from(affiliateProfiles)
    .where(eq(affiliateProfiles.code, affiliateCode))
    .limit(1)

  if (profile.length === 0) {
    return null
  }

  return {
    profileId: profile[0].id,
    userId: profile[0].userId,
  }
}

/**
 * 创建推广关系（绑定）
 * @param referrerProfileId 推广人资料ID
 * @param inviteeUserId 被推广人用户ID
 */
export async function createAffiliateRelation(
  referrerProfileId: string,
  inviteeUserId: string
): Promise<string> {
  // 检查是否已存在关系
  const existing = await db
    .select()
    .from(affiliateRelations)
    .where(eq(affiliateRelations.inviteeId, inviteeUserId))
    .limit(1)

  if (existing.length > 0) {
    // 如果已存在，返回现有关系ID
    return existing[0].id
  }

  // 计算过期时间（注册后30天）
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const relationId = nanoid()
  await db.insert(affiliateRelations).values({
    id: relationId,
    referrerId: referrerProfileId,
    inviteeId: inviteeUserId,
    expiresAt,
    hasConverted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return relationId
}

/**
 * 处理首单佣金（30%）
 * @param inviteeUserId 被推广人用户ID
 * @param orderAmount 订单金额（分为单位）
 * @param stripeOrderId Stripe订单ID
 */
export async function processAffiliateCommission(
  inviteeUserId: string,
  orderAmount: number,
  stripeOrderId: string
): Promise<void> {
  // 注意：neon-http 驱动不支持事务，直接使用 db
  
  // 0. 检查是否已经处理过这个订单（防重复处理）
  const existingEarning = await db
    .select()
    .from(affiliateEarnings)
    .where(eq(affiliateEarnings.stripeOrderId, stripeOrderId))
    .limit(1)

  if (existingEarning.length > 0) {
    // 已经处理过这个订单，直接返回
    return
  }

  // 1. 查询推广关系（只查询未转化的关系，确保只处理首单）
  const relation = await db
    .select()
    .from(affiliateRelations)
    .where(
      and(
        eq(affiliateRelations.inviteeId, inviteeUserId),
        gte(affiliateRelations.expiresAt, new Date()), // 检查是否在有效期内
        eq(affiliateRelations.hasConverted, false) // 检查是否未转化（只处理首单）
      )
    )
    .limit(1)

  if (relation.length === 0) {
    // 没有有效的推广关系，直接返回
    return
  }

  const relationRecord = relation[0]

  // 2. 计算佣金（30%）
  const commissionAmount = Math.floor(orderAmount * 0.3)

  // 3. 计算解冻日期（7天后）
  const releaseDate = new Date()
  releaseDate.setDate(releaseDate.getDate() + 7)

  // 4. 创建佣金记录（状态为 FROZEN）
  const earningId = nanoid()
  await db.insert(affiliateEarnings).values({
    id: earningId,
    affiliateId: relationRecord.referrerId,
    amount: commissionAmount,
    status: 'FROZEN',
    releaseDate,
    stripeOrderId,
    relationId: relationRecord.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // 5. 更新推广人资料：增加冻结余额
  await db
    .update(affiliateProfiles)
    .set({
      frozenBalance: sql`${affiliateProfiles.frozenBalance} + ${commissionAmount}`,
      updatedAt: new Date(),
    })
    .where(eq(affiliateProfiles.id, relationRecord.referrerId))

  // 6. 更新关系表：标记为已转化（确保后续订单不会再次处理）
  await db
    .update(affiliateRelations)
    .set({
      hasConverted: true,
      updatedAt: new Date(),
    })
    .where(eq(affiliateRelations.id, relationRecord.id))
}

/**
 * 自动解冻资金（在调用 API 时自动检测并解冻）
 * @param affiliateId 可选的推广人ID，如果提供则只解冻该推广人的资金，否则解冻所有到期的资金
 */
export async function releaseFrozenFunds(affiliateId?: string): Promise<{
  released: number
  totalAmount: number
}> {
  const now = new Date()
  let released = 0
  let totalAmount = 0

  // 构建查询条件
  const conditions = [
    eq(affiliateEarnings.status, 'FROZEN'),
    lte(affiliateEarnings.releaseDate, now)
  ]

  // 如果指定了推广人ID，只解冻该推广人的资金
  if (affiliateId) {
    conditions.push(eq(affiliateEarnings.affiliateId, affiliateId))
  }

  // 查询需要解冻的记录
  const frozenEarnings = await db
    .select()
    .from(affiliateEarnings)
    .where(and(...conditions))

  if (frozenEarnings.length === 0) {
    return { released: 0, totalAmount: 0 }
  }

  // 按推广人分组处理
  const earningsByAffiliate = new Map<string, typeof frozenEarnings>()
  for (const earning of frozenEarnings) {
    if (!earningsByAffiliate.has(earning.affiliateId)) {
      earningsByAffiliate.set(earning.affiliateId, [])
    }
    earningsByAffiliate.get(earning.affiliateId)!.push(earning)
  }

  // 注意：neon-http 驱动不支持事务，直接使用 db
  for (const [affId, earnings] of earningsByAffiliate) {
    const totalFrozenAmount = earnings.reduce((sum, e) => sum + e.amount, 0)

    // 更新所有相关佣金记录状态
    for (const earning of earnings) {
      await db
        .update(affiliateEarnings)
        .set({
          status: 'RELEASED',
          updatedAt: new Date(),
        })
        .where(eq(affiliateEarnings.id, earning.id))
    }

    // 更新推广人资料：减少冻结余额，增加可用余额
    await db
      .update(affiliateProfiles)
      .set({
        frozenBalance: sql`${affiliateProfiles.frozenBalance} - ${totalFrozenAmount}`,
        balance: sql`${affiliateProfiles.balance} + ${totalFrozenAmount}`,
        updatedAt: new Date(),
      })
      .where(eq(affiliateProfiles.id, affId))

    released += earnings.length
    totalAmount += totalFrozenAmount
  }

  return { released, totalAmount }
}

/**
 * 处理退款（取消冻结的佣金）
 * @param stripeOrderId Stripe订单ID
 */
export async function handleAffiliateRefund(stripeOrderId: string): Promise<void> {
  // 注意：neon-http 驱动不支持事务，直接使用 db
  // 查询相关的冻结佣金记录
  const earningsRecords = await db
    .select()
    .from(affiliateEarnings)
    .where(
      and(
        eq(affiliateEarnings.stripeOrderId, stripeOrderId),
        eq(affiliateEarnings.status, 'FROZEN')
      )
    )

  if (earningsRecords.length === 0) {
    // 没有找到相关的冻结佣金，可能已经解冻或不存在
    return
  }

  // 按推广人分组处理
  const earningsByAffiliate = new Map<string, typeof earningsRecords>()
  for (const earning of earningsRecords) {
    if (!earningsByAffiliate.has(earning.affiliateId)) {
      earningsByAffiliate.set(earning.affiliateId, [])
    }
    earningsByAffiliate.get(earning.affiliateId)!.push(earning)
  }

  // 处理每个推广人的退款
  for (const [affiliateId, earningsList] of earningsByAffiliate) {
    const totalRefundAmount = earningsList.reduce((sum, e) => sum + e.amount, 0)

    // 更新佣金记录状态为 CANCELLED
    for (const earning of earningsList) {
      await db
        .update(affiliateEarnings)
        .set({
          status: 'CANCELLED',
          updatedAt: new Date(),
        })
        .where(eq(affiliateEarnings.id, earning.id))
    }

    // 更新推广人资料：减少冻结余额
    await db
      .update(affiliateProfiles)
      .set({
        frozenBalance: sql`${affiliateProfiles.frozenBalance} - ${totalRefundAmount}`,
        updatedAt: new Date(),
      })
      .where(eq(affiliateProfiles.id, affiliateId))
  }
}

/**
 * 获取推广人统计信息
 */
export async function getAffiliateStats(affiliateProfileId: string) {
  const profile = await db
    .select()
    .from(affiliateProfiles)
    .where(eq(affiliateProfiles.id, affiliateProfileId))
    .limit(1)

  if (profile.length === 0) {
    return null
  }

  // 获取推广关系统计
  const relations = await db
    .select()
    .from(affiliateRelations)
    .where(eq(affiliateRelations.referrerId, affiliateProfileId))

  const convertedRelations = relations.filter((r) => r.hasConverted)

  // 获取佣金统计
  const earnings = await db
    .select()
    .from(affiliateEarnings)
    .where(eq(affiliateEarnings.affiliateId, affiliateProfileId))

  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0)
  const releasedEarnings = earnings
    .filter((e) => e.status === 'RELEASED')
    .reduce((sum, e) => sum + e.amount, 0)
  const frozenEarnings = earnings
    .filter((e) => e.status === 'FROZEN')
    .reduce((sum, e) => sum + e.amount, 0)

  return {
    profile: profile[0],
    totalRelations: relations.length,
    convertedRelations: convertedRelations.length,
    totalEarnings,
    releasedEarnings,
    frozenEarnings,
    earnings,
  }
}

/**
 * 创建提现申请
 * @param affiliateId 推广人ID
 * @param amount 提现金额（美分为单位）
 * @param paymentMethod 支付方式（alipay, paypal等）
 * @param accountName 账户姓名
 * @param accountInfo 账户信息（支付宝账号、PayPal邮箱等）
 */
export async function createWithdrawal(
  affiliateId: string,
  amount: number,
  paymentMethod: string,
  accountName: string,
  accountInfo: string
): Promise<{ success: boolean; error?: string; withdrawalId?: string }> {
  // 最小提现金额（10美元 = 1000分）
  const minAmount = 1000

  if (amount < minAmount) {
    return { success: false, error: 'MIN_AMOUNT_NOT_MET' }
  }

  // 注意：neon-http 驱动不支持事务，直接使用 db
  // 获取推广人资料
  const profile = await db
    .select()
    .from(affiliateProfiles)
    .where(eq(affiliateProfiles.id, affiliateId))
    .limit(1)

  if (profile.length === 0) {
    return { success: false, error: 'PROFILE_NOT_FOUND' }
  }

  const currentProfile = profile[0]

  // 检查可用余额是否足够
  if (currentProfile.balance < amount) {
    return { success: false, error: 'INSUFFICIENT_BALANCE' }
  }

  // 创建提现记录
  const withdrawalId = nanoid()
  await db.insert(affiliateWithdrawals).values({
    id: withdrawalId,
    affiliateId,
    amount,
    status: 'PENDING',
    paymentMethod,
    accountName,
    accountInfo,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // 扣除可用余额
  await db
    .update(affiliateProfiles)
    .set({
      balance: sql`${affiliateProfiles.balance} - ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(affiliateProfiles.id, affiliateId))

  return { success: true, withdrawalId }
}

/**
 * 获取提现记录列表
 * @param affiliateId 推广人ID
 * @param page 页码
 * @param limit 每页数量
 */
export async function getWithdrawals(
  affiliateId: string,
  page: number = 1,
  limit: number = 20
) {
  const offset = (page - 1) * limit

  // 获取提现记录列表
  const withdrawals = await db
    .select()
    .from(affiliateWithdrawals)
    .where(eq(affiliateWithdrawals.affiliateId, affiliateId))
    .orderBy(desc(affiliateWithdrawals.createdAt))
    .limit(limit)
    .offset(offset)

  // 获取总数
  const totalWithdrawals = await db
    .select()
    .from(affiliateWithdrawals)
    .where(eq(affiliateWithdrawals.affiliateId, affiliateId))

  return {
    data: withdrawals,
    pagination: {
      page,
      limit,
      total: totalWithdrawals.length,
      totalPages: Math.ceil(totalWithdrawals.length / limit),
    },
  }
}

