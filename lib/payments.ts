import { db } from './db'
import { stripePayments, users } from './schema'
import { eq, desc, and, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

// 支付状态枚举
export enum PaymentStatus {
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  PENDING = 'pending',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}

// 支付类型枚举
export enum PaymentType {
  SUBSCRIPTION = 'subscription',
  POINTS_PURCHASE = 'points_purchase',
  ONE_TIME = 'one_time'
}

// 支付记录接口
export interface PaymentRecord {
  id: string
  userId: string
  stripeCustomerId: string
  paymentIntentId?: string
  checkoutSessionId?: string
  subscriptionId?: string
  invoiceId?: string
  paymentStatus: PaymentStatus
  paymentType: PaymentType
  amount: number
  currency: string
  productName?: string
  productDescription?: string
  priceId?: string
  pointsAmount?: number
  pointsType?: string
  subscriptionPlan?: string
  subscriptionPeriodStart?: Date
  subscriptionPeriodEnd?: Date
  refundAmount?: number
  refundReason?: string
  refundedAt?: Date
  metadata?: string
  webhookEventId?: string
  createdAt: Date
  updatedAt: Date
}

// 创建支付记录
export async function createPaymentRecord(data: {
  userId: string
  stripeCustomerId: string
  paymentIntentId?: string
  checkoutSessionId?: string
  subscriptionId?: string
  invoiceId?: string
  paymentStatus: PaymentStatus
  paymentType: PaymentType
  amount: number
  currency?: string
  productName?: string
  productDescription?: string
  priceId?: string
  pointsAmount?: number
  pointsType?: string
  subscriptionPlan?: string
  subscriptionPeriodStart?: Date
  subscriptionPeriodEnd?: Date
  metadata?: any
  webhookEventId?: string
}) {
  try {
    const paymentRecord = await db.insert(stripePayments).values({
      id: uuidv4(),
      userId: data.userId,
      stripeCustomerId: data.stripeCustomerId,
      paymentIntentId: data.paymentIntentId,
      checkoutSessionId: data.checkoutSessionId,
      subscriptionId: data.subscriptionId,
      invoiceId: data.invoiceId,
      paymentStatus: data.paymentStatus,
      paymentType: data.paymentType,
      amount: data.amount,
      currency: data.currency || 'usd',
      productName: data.productName,
      productDescription: data.productDescription,
      priceId: data.priceId,
      pointsAmount: data.pointsAmount,
      pointsType: data.pointsType,
      subscriptionPlan: data.subscriptionPlan,
      subscriptionPeriodStart: data.subscriptionPeriodStart,
      subscriptionPeriodEnd: data.subscriptionPeriodEnd,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      webhookEventId: data.webhookEventId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()

    return paymentRecord[0]
  } catch (error) {
    console.error('创建支付记录失败:', error)
    throw error
  }
}

// 更新支付记录
export async function updatePaymentRecord(
  paymentId: string,
  updates: Partial<{
    paymentStatus: PaymentStatus
    refundAmount: number
    refundReason: string
    refundedAt: Date
    metadata: any
  }>
) {
  try {
    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    }

    if (updates.metadata) {
      updateData.metadata = JSON.stringify(updates.metadata)
    }

    const updatedRecord = await db
      .update(stripePayments)
      .set(updateData)
      .where(eq(stripePayments.id, paymentId))
      .returning()

    return updatedRecord[0]
  } catch (error) {
    console.error('更新支付记录失败:', error)
    throw error
  }
}

// 获取用户的支付记录
export async function getUserPaymentHistory(
  userId: string,
  options: {
    limit?: number
    offset?: number
    paymentType?: PaymentType
    paymentStatus?: PaymentStatus
  } = {}
) {
  try {
    const { limit = 50, offset = 0, paymentType, paymentStatus } = options

    // 构建查询条件
    let whereConditions = [eq(stripePayments.userId, userId)]
    
    if (paymentType) {
      whereConditions.push(eq(stripePayments.paymentType, paymentType))
    }
    
    if (paymentStatus) {
      whereConditions.push(eq(stripePayments.paymentStatus, paymentStatus))
    }

    const payments = await db
      .select()
      .from(stripePayments)
      .where(and(...whereConditions))
      .orderBy(desc(stripePayments.createdAt))
      .limit(limit)
      .offset(offset)

    return payments.map(payment => ({
      ...payment,
      metadata: payment.metadata ? JSON.parse(payment.metadata) : null
    }))
  } catch (error) {
    console.error('获取用户支付记录失败:', error)
    throw error
  }
}

// 获取单个支付记录
export async function getPaymentRecord(paymentId: string) {
  try {
    const payment = await db
      .select()
      .from(stripePayments)
      .where(eq(stripePayments.id, paymentId))
      .limit(1)

    if (payment.length === 0) {
      return null
    }

    return {
      ...payment[0],
      metadata: payment[0].metadata ? JSON.parse(payment[0].metadata) : null
    }
  } catch (error) {
    console.error('获取支付记录失败:', error)
    throw error
  }
}

// 根据Stripe ID获取支付记录
export async function getPaymentByStripeId(stripeId: string, type: 'payment_intent' | 'session' | 'subscription') {
  try {
    let whereCondition
    
    switch (type) {
      case 'payment_intent':
        whereCondition = eq(stripePayments.paymentIntentId, stripeId)
        break
      case 'session':
        whereCondition = eq(stripePayments.checkoutSessionId, stripeId)
        break
      case 'subscription':
        whereCondition = eq(stripePayments.subscriptionId, stripeId)
        break
      default:
        throw new Error('Invalid stripe ID type')
    }

    const payment = await db
      .select()
      .from(stripePayments)
      .where(whereCondition)
      .limit(1)

    if (payment.length === 0) {
      return null
    }

    return {
      ...payment[0],
      metadata: payment[0].metadata ? JSON.parse(payment[0].metadata) : null
    }
  } catch (error) {
    console.error('根据Stripe ID获取支付记录失败:', error)
    throw error
  }
}

// 获取用户支付统计
export async function getUserPaymentStats(userId: string) {
  try {
    const stats = await db
      .select({
        totalPayments: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(${stripePayments.amount})`,
        totalPointsPurchased: sql<number>`
          coalesce(sum(
            case 
              when ${stripePayments.pointsType} = 'purchased' 
                then ${stripePayments.pointsAmount} 
              else 0 
            end
          ), 0)
        `,
        totalPointsGifted: sql<number>`
          coalesce(sum(
            case 
              when ${stripePayments.pointsType} = 'gifted' 
                then ${stripePayments.pointsAmount} 
              else 0 
            end
          ), 0)
        `,
        successfulPayments: sql<number>`count(case when ${stripePayments.paymentStatus} = 'succeeded' then 1 end)`,
        failedPayments: sql<number>`count(case when ${stripePayments.paymentStatus} = 'failed' then 1 end)`,
        refundedPayments: sql<number>`count(case when ${stripePayments.paymentStatus} = 'refunded' then 1 end)`,
        subscriptionPayments: sql<number>`count(case when ${stripePayments.paymentType} = 'subscription' then 1 end)`,
        pointsPayments: sql<number>`count(case when ${stripePayments.paymentType} = 'points_purchase' then 1 end)`,
      })
      .from(stripePayments)
      .where(eq(stripePayments.userId, userId))

    return stats[0] || {
      totalPayments: 0,
      totalAmount: 0,
      totalPointsPurchased: 0,
      totalPointsGifted: 0,
      successfulPayments: 0,
      failedPayments: 0,
      refundedPayments: 0,
      subscriptionPayments: 0,
      pointsPayments: 0,
    }
  } catch (error) {
    console.error('获取用户支付统计失败:', error)
    throw error
  }
}

// 获取用户最近的支付记录
export async function getUserRecentPayments(userId: string, limit: number = 5) {
  try {
    const payments = await db
      .select()
      .from(stripePayments)
      .where(eq(stripePayments.userId, userId))
      .orderBy(desc(stripePayments.createdAt))
      .limit(limit)

    return payments.map(payment => ({
      ...payment,
      metadata: payment.metadata ? JSON.parse(payment.metadata) : null
    }))
  } catch (error) {
    console.error('获取用户最近支付记录失败:', error)
    throw error
  }
} 