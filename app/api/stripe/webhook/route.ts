import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { getSubscriptionGiftedPoints } from '@/lib/points'
import { users, pointsHistory, stripePayments, referrals, referralHistory } from '@/lib/schema'
import { eq, sql, and, gte } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { createPaymentRecord, PaymentStatus, PaymentType } from '@/lib/payments'
import { handleReferredUserSubscription } from '@/lib/referral'
import { SUBSCRIPTION_PRODUCTS } from '@/lib/stripe'
import { processAffiliateCommission, handleAffiliateRefund } from '@/lib/affiliate'
import { sendPointsPurchaseEmail, sendSubscriptionSuccessEmail } from '@/lib/email'
import { expireSubscriptionIfNeeded } from '@/lib/subscription'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Webhook 错误日志函数：仅在开发环境输出，生产环境静默
const logWebhookError = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(...args)
  }
}

// 默认邮件语言（注册流程未在 users 表中持久化语言偏好，故此处统一使用英文）
const DEFAULT_EMAIL_LOCALE: 'en' | 'zh' | 'ja' | 'ko' | 'tw' = 'en'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const sig = headersList.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err) {
      logWebhookError('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // 处理支付成功事件（积分购买）
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      
      const userId = paymentIntent.metadata.userId
      const points = parseInt(paymentIntent.metadata.points)
      const type = paymentIntent.metadata.type

      if (type === 'points_purchase' && userId && points) {
        try {
          // 幂等性检查：是否已记录该 payment_intent
          const exists = await db
            .select()
            .from(stripePayments)
            .where(and(
              eq(stripePayments.paymentIntentId, paymentIntent.id)
            ))
            .limit(1)

          if (exists.length > 0) {
            return NextResponse.json({ received: true })
          }

          // 更新用户购买积分（永不过期）
          await db
            .update(users)
            .set({
              points: sql`${users.points} + ${points}`,
              purchasedPoints: sql`${users.purchasedPoints} + ${points}`,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId))

          // 记录积分历史
          await db.insert(pointsHistory).values({
            id: uuidv4(),
            userId,
            points,
            pointsType: 'purchased',
            action: 'purchase',
            description: `购买积分 - 支付 $${(paymentIntent.amount / 100).toFixed(2)}`,
            createdAt: new Date(),
          })

          // 创建支付记录
          await createPaymentRecord({
            userId,
            stripeCustomerId: paymentIntent.customer as string,
            paymentIntentId: paymentIntent.id,
            paymentStatus: PaymentStatus.SUCCEEDED,
            paymentType: PaymentType.POINTS_PURCHASE,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            pointsAmount: points,
            pointsType: 'purchased',
            productName: `${points.toLocaleString()} 积分`,
            productDescription: `购买 ${points.toLocaleString()} 积分`,
            metadata: paymentIntent.metadata,
            webhookEventId: event.id,
          })

          // 发送积分充值成功邮件
          try {
            const user = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1)
            if (user.length > 0 && user[0].email) {
              // 根据邮箱判断语言偏好（简单判断，可以根据实际需求优化）
              const locale = DEFAULT_EMAIL_LOCALE // 默认英文，可以根据实际需求调整
              await sendPointsPurchaseEmail(
                user[0].email,
                points,
                paymentIntent.amount,
                paymentIntent.currency,
                locale
              )
            }
          } catch (emailError) {
            logWebhookError('Failed to send points purchase email:', emailError)
            // 邮件发送失败不影响主流程
          }

        } catch (error) {
          logWebhookError('Points purchase failed:', error)
          // 这里可以添加重试逻辑或者错误通知
        }
      }
    }

    // 处理订阅相关事件
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.mode === 'subscription') {
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        // 检查是否已经处理过这个checkout session（防重复处理）
        const existingRecord = await db
          .select()
          .from(stripePayments)
          .where(eq(stripePayments.checkoutSessionId, session.id))
          .limit(1)
        const hasPaymentRecord = existingRecord.length > 0

        // 在 try/catch 外记录用户ID，便于出错时写入失败上下文（可选）
        let processedUserId: string | null = null

        try {
          // 获取客户邮箱 - 如果session中没有邮箱，从Stripe获取
          let customerEmail = session.customer_email
          if (!customerEmail && customerId) {
            try {
              const customer = await stripe.customers.retrieve(customerId)
              if (customer && !customer.deleted && customer.email) {
                customerEmail = customer.email
              }
            } catch (customerError) {
              logWebhookError('Failed to retrieve customer:', customerError)
            }
          }

          if (!customerEmail) {
            logWebhookError('Customer email not found:', {
              sessionCustomerEmail: session.customer_email,
              customerId,
              subscriptionId
            })
            return NextResponse.json({ received: true, warning: 'Customer email not found, will retry' })
          }

          // 通过邮箱查找用户
          const user = await db.select().from(users).where(eq(users.email, customerEmail)).limit(1)

          if (user.length === 0) {
            logWebhookError('User not found:', customerEmail)
            return NextResponse.json({ received: true, warning: 'User not found, will retry' })
          }

          processedUserId = user[0].id

          // 主动使用Stripe SDK获取最新的完整订阅信息
          const latestSubscription = await stripe.subscriptions.retrieve(subscriptionId)

          // 从订阅信息中获取订阅计划
          // 优先从 checkout session metadata 中获取 planType，其次从 subscription metadata 获取，最后从价格 ID 推断
          let subscriptionPlan = 'pro' // 默认值
          if (session.metadata?.planType) {
            subscriptionPlan = session.metadata.planType
          } else if (latestSubscription.metadata?.plan) {
            subscriptionPlan = latestSubscription.metadata.plan
          } else if (latestSubscription.metadata?.subscriptionPlan) {
            subscriptionPlan = latestSubscription.metadata.subscriptionPlan
          } else {
            // 从价格 ID 推断（如果价格 ID 匹配已知的订阅价格）
            const priceId = latestSubscription.items.data[0]?.price?.id
            if (priceId === process.env.STRIPE_TRIAL_PRICE_ID) {
              subscriptionPlan = 'trial'
            } else if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
              subscriptionPlan = 'pro'
            } else if (priceId === process.env.STRIPE_ANNUAL_PRICE_ID) {
              subscriptionPlan = 'annual'
            }
            // 可以在这里添加其他订阅计划的判断
          }

          // 计算新的到期时间：
          // 根据订阅计划类型计算不同的周期
          // trial: 7天，pro: 30天，annual: 365天
          let finalEndDate: Date
          const currentUser = user[0]
          const hasActiveSubscription = currentUser.subscriptionStatus === 'active' &&
                                       currentUser.subscriptionCurrentPeriodEnd &&
                                       currentUser.subscriptionCurrentPeriodEnd > new Date()
          const isUpgradingFromTrial = hasActiveSubscription && 
                                      currentUser.subscriptionPlan === 'trial' && 
                                      (subscriptionPlan === 'pro' || subscriptionPlan === 'annual')
          const isUpgradingToAnnual = hasActiveSubscription && 
                                     subscriptionPlan === 'annual' &&
                                     (currentUser.subscriptionPlan === 'trial' || currentUser.subscriptionPlan === 'pro')

          // 根据订阅计划确定周期天数
          const isTrialPlan = subscriptionPlan === 'trial'
          const isAnnualPlan = subscriptionPlan === 'annual'
          const periodDays = isTrialPlan ? 7 : (isAnnualPlan ? 365 : 30)
          const periodDaysInMs = periodDays * 24 * 60 * 60 * 1000

          if (hasActiveSubscription) {
            // 在现有到期时间基础上累加周期天数
            // 如果是从trial/pro升级到annual，在现有到期时间基础上累加365天
            // 如果是annual续费，在现有到期时间基础上累加365天
            const currentEndTime = currentUser.subscriptionCurrentPeriodEnd!.getTime()
            finalEndDate = new Date(currentEndTime + periodDaysInMs)
          } else {
            // 从订阅创建时间开始计算周期天数
            const subscriptionCreated = latestSubscription.created
            const periodLater = subscriptionCreated + (periodDays * 24 * 60 * 60)
            finalEndDate = new Date(periodLater * 1000)
          }

          // 仅在首次处理该 session 时更新用户与赠送积分，避免重复累加
          if (!hasPaymentRecord) {
            // 从配置中获取订阅赠送的积分数量
            const giftedPoints = getSubscriptionGiftedPoints(subscriptionPlan as keyof typeof SUBSCRIPTION_PRODUCTS)
            const previousPoints = currentUser.points ?? 0
            const previousGiftedPoints = currentUser.giftedPoints ?? 0
            const newPointsTotal = previousPoints + giftedPoints
            const newGiftedPointsTotal = previousGiftedPoints + giftedPoints

            // 如果是试用订阅，标记用户已订阅过试用版
            const updateData: any = {
              stripeCustomerId: customerId,
              subscriptionId: latestSubscription.id,
              subscriptionStatus: latestSubscription.status,
              subscriptionPlan: subscriptionPlan,
              subscriptionCurrentPeriodEnd: finalEndDate,
              points: sql`${users.points} + ${giftedPoints}`,
              giftedPoints: sql`${users.giftedPoints} + ${giftedPoints}`,
              updatedAt: new Date(),
            }

            // 如果是试用订阅，设置hasTrialSubscription为true
            if (subscriptionPlan === 'trial') {
              updateData.hasTrialSubscription = true
            }

            await db
              .update(users)
              .set(updateData)
              .where(eq(users.id, user[0].id))
          } else {
          }

          // 计算订阅时长（天数）用于推荐奖励
          // 优先使用 Stripe 的 current_period_* 字段；缺失时按价格的 recurring 维度推断
          const price = latestSubscription.items.data[0]?.price
          const recurring = price?.recurring as any | undefined
          const interval = recurring?.interval as ('day' | 'week' | 'month' | 'year' | undefined)
          const intervalCount = (recurring?.interval_count as number | undefined) ?? 1

          let subscriptionPeriodStart = (latestSubscription as any).current_period_start as number | undefined
          let subscriptionPeriodEnd = (latestSubscription as any).current_period_end as number | undefined

          // 兜底：根据计划周期推断天数
          const intervalToDays = (i?: 'day'|'week'|'month'|'year', count: number = 1) => {
            switch (i) {
              case 'day': return 1 * count
              case 'week': return 7 * count
              case 'month': return 30 * count
              case 'year': return 365 * count
              default: return 30
            }
          }

          let subscriptionDays = 0
          if (typeof subscriptionPeriodStart === 'number' && typeof subscriptionPeriodEnd === 'number') {
            const subscriptionDurationSeconds = subscriptionPeriodEnd - subscriptionPeriodStart
            subscriptionDays = Math.max(1, Math.floor(subscriptionDurationSeconds / (24 * 60 * 60)))
          } else {
            subscriptionDays = Math.max(1, intervalToDays(interval, intervalCount))
          }

          // 处理推荐奖励：如果该用户是被邀请的用户，给邀请者发放订阅奖励
          const referralCheck = await db
            .select()
            .from(referrals)
            .where(eq(referrals.referredId, user[0].id))
            .limit(1)

          // 推导本周期的开始时间用于奖励去重
          const dayMs = 24 * 60 * 60 * 1000
          let periodStartDate: Date | null = null
          if (typeof subscriptionPeriodStart === 'number') {
            periodStartDate = new Date(subscriptionPeriodStart * 1000)
          } else {
            const baseEnd = hasPaymentRecord ? (currentUser.subscriptionCurrentPeriodEnd ?? finalEndDate) : finalEndDate
            periodStartDate = new Date(baseEnd.getTime() - subscriptionDays * dayMs)
          }

          if (referralCheck.length > 0) {
            // 推荐奖励幂等性：同一订阅周期内只发一次
            const existingReward = await db
              .select()
              .from(referralHistory)
              .where(
                and(
                  eq(referralHistory.referralId, referralCheck[0].id),
                  eq(referralHistory.action, 'subscription_reward'),
                  gte(referralHistory.createdAt, periodStartDate!)
                )
              )
              .limit(1)

            if (existingReward.length === 0) {
              try {
                await handleReferredUserSubscription(
                  user[0].id,
                  subscriptionDays,
                  subscriptionPlan
                )
              } catch (referralError) {
                logWebhookError('Referral reward processing failed:', referralError)
                // 推荐奖励处理失败不影响订阅流程
              }
            }
          }

          // 推荐奖励处理完成后，再记录积分历史和支付记录
          // 记录赠送积分历史（仅首次处理该 session 时写入）
          if (!hasPaymentRecord) {
            // 从配置中获取订阅赠送的积分数量
            const giftedPoints = getSubscriptionGiftedPoints(subscriptionPlan as keyof typeof SUBSCRIPTION_PRODUCTS)
            
            // 判断是续订、升级还是新订阅
            // 同一版本才是续订，不同版本是升级
            const previousPlan = currentUser.subscriptionPlan
            const isRenewal = hasActiveSubscription && previousPlan === subscriptionPlan
            const isUpgrade = hasActiveSubscription && previousPlan && previousPlan !== subscriptionPlan
            
            // 确定 action 类型
            let action: string
            if (isRenewal) {
              action = 'subscription_renewal_gift'
            } else if (isUpgrade) {
              action = 'subscription_upgrade_gift'
            } else {
              action = 'subscription_gift'
            }
            
            // 获取订阅计划显示名称（用于描述）
            const getPlanDisplayName = (plan: string): string => {
              // 简单的格式化：首字母大写
              return plan.charAt(0).toUpperCase() + plan.slice(1)
            }
            const planDisplayName = getPlanDisplayName(subscriptionPlan)
            
            // 根据类型生成描述
            let description: string
            if (isRenewal) {
              // 续订：同一版本
              const periodDays = subscriptionPlan === 'annual' ? 365 : (subscriptionPlan === 'trial' ? 7 : 30)
              description = `续订${planDisplayName}赠送积分（时间累加${periodDays}天）`
            } else if (isUpgrade) {
              // 升级：不同版本
              description = `升级${planDisplayName}赠送积分`
            } else {
              // 新订阅
              description = `订阅${planDisplayName}赠送积分`
            }
            
            const pointsHistoryId = uuidv4()
            const pointsHistoryPayload = {
              id: pointsHistoryId,
              userId: user[0].id,
              points: giftedPoints,
              pointsType: 'gifted' as const,
              action: action as any,
              description,
              createdAt: new Date(),
            }

            await db.insert(pointsHistory).values(pointsHistoryPayload)

            // 创建订阅支付记录（仅当尚未创建过时）
            const subscriptionPaymentRecordPayload = {
              userId: user[0].id,
              stripeCustomerId: customerId,
              checkoutSessionId: session.id,
              subscriptionId: latestSubscription.id,
              paymentStatus: PaymentStatus.SUCCEEDED,
              paymentType: PaymentType.SUBSCRIPTION,
              amount: session.amount_total || 0,
              currency: session.currency || 'usd',
              subscriptionPlan: subscriptionPlan,
              subscriptionPeriodStart: new Date(latestSubscription.created * 1000),
              subscriptionPeriodEnd: finalEndDate,
              pointsAmount: giftedPoints,
              pointsType: 'gifted' as const,
              productName: `${planDisplayName}订阅`,
              productDescription: isRenewal
                ? `续订${planDisplayName}订阅，赠送${giftedPoints}积分`
                : isUpgrade
                ? `升级${planDisplayName}订阅，赠送${giftedPoints}积分`
                : `订阅${planDisplayName}，赠送${giftedPoints}积分`,
              priceId: latestSubscription.items.data[0]?.price?.id,
              metadata: session.metadata,
              webhookEventId: event.id,
            }

            await createPaymentRecord(subscriptionPaymentRecordPayload)

            // 发送订阅购买成功邮件
            try {
              if (customerEmail) {
                // 根据邮箱判断语言偏好（简单判断，可以根据实际需求优化）
                const locale = DEFAULT_EMAIL_LOCALE // 默认英文，可以根据实际需求调整
                await sendSubscriptionSuccessEmail(
                  customerEmail,
                  `${planDisplayName}订阅`,
                  subscriptionPlan,
                  finalEndDate,
                  session.amount_total || 0,
                  session.currency || 'usd',
                  locale
                )
              }
            } catch (emailError) {
              logWebhookError('Failed to send subscription success email:', emailError)
              // 邮件发送失败不影响主流程
            }

            // ========== 处理推广返利系统（完全独立于推荐系统） ==========
            // 处理首单佣金（30%）
            if (processedUserId && !hasPaymentRecord) {
              try {
                const orderAmount = session.amount_total || 0
                // 使用 checkout session ID 作为订单ID
                await processAffiliateCommission(
                  processedUserId,
                  orderAmount,
                  session.id
                )
              } catch (affiliateError) {
                logWebhookError('Affiliate commission processing failed:', affiliateError)
                // 推广返利处理失败不影响订阅流程
              }
            }
          } else {
          }
        } catch (error) {
          logWebhookError('Subscription processing failed:', error)

          // 失败时不强制写入有外键约束的失败记录，避免再次报错；交由 Stripe 重试
          if (processedUserId) {
            try {
              const { nanoid: generateId } = await import('nanoid')
              await db.insert(stripePayments).values({
                id: generateId(),
                userId: processedUserId,
                stripeCustomerId: customerId || 'UNKNOWN',
                checkoutSessionId: session.id,
                paymentType: 'subscription',
                paymentStatus: 'failed',
                amount: 0,
                currency: 'usd',
                createdAt: new Date(),
              })
            } catch (insertError) {
              logWebhookError('Failed to record failed session:', insertError)
            }
          }
        }
      } else if (session.mode === 'payment' && session.metadata?.planType === 'trial') {
        // 处理试用订阅的一次性支付
        const customerId = session.customer as string
        const planType = session.metadata.planType

        // 检查是否已经处理过这个checkout session（防重复处理）
        const existingRecord = await db
          .select()
          .from(stripePayments)
          .where(eq(stripePayments.checkoutSessionId, session.id))
          .limit(1)
        const hasPaymentRecord = existingRecord.length > 0

        if (hasPaymentRecord) {
          return NextResponse.json({ received: true })
        }

        try {
          // 获取客户邮箱
          let customerEmail = session.customer_email
          if (!customerEmail && customerId) {
            try {
              const customer = await stripe.customers.retrieve(customerId)
              if (customer && !customer.deleted && customer.email) {
                customerEmail = customer.email
              }
            } catch (customerError) {
              logWebhookError('Failed to retrieve customer:', customerError)
            }
          }

          if (!customerEmail) {
            logWebhookError('Customer email not found for trial payment:', {
              sessionCustomerEmail: session.customer_email,
              customerId,
            })
            return NextResponse.json({ received: true, warning: 'Customer email not found, will retry' })
          }

          // 通过邮箱查找用户
          const user = await db.select().from(users).where(eq(users.email, customerEmail)).limit(1)

          if (user.length === 0) {
            logWebhookError('User not found for trial payment:', customerEmail)
            return NextResponse.json({ received: true, warning: 'User not found, will retry' })
          }

          const currentUser = user[0]

          // 检查用户是否已经订阅过试用版
          if (currentUser.hasTrialSubscription) {
            return NextResponse.json({ received: true, warning: 'User already has trial subscription' })
          }

          // 检查用户是否已经有active的pro、annual或enterprise订阅
          const now = new Date()
          const hasActiveProOrAnnualSubscription = 
            currentUser.subscriptionStatus === 'active' &&
            (currentUser.subscriptionPlan === 'pro' || currentUser.subscriptionPlan === 'annual' || currentUser.subscriptionPlan === 'enterprise') &&
            currentUser.subscriptionCurrentPeriodEnd &&
            currentUser.subscriptionCurrentPeriodEnd > now
          
          if (hasActiveProOrAnnualSubscription) {
            return NextResponse.json({ received: true, warning: 'User already has active Pro/Annual subscription' })
          }

          // 计算试用订阅到期时间（7天）
          const periodDays = 7
          const periodDaysInMs = periodDays * 24 * 60 * 60 * 1000
          const finalEndDate = new Date(now.getTime() + periodDaysInMs)

          // 从配置中获取订阅赠送的积分数量
          const giftedPoints = getSubscriptionGiftedPoints('trial' as keyof typeof SUBSCRIPTION_PRODUCTS)
          const previousPoints = currentUser.points ?? 0
          const previousGiftedPoints = currentUser.giftedPoints ?? 0
          const newPointsTotal = previousPoints + giftedPoints
          const newGiftedPointsTotal = previousGiftedPoints + giftedPoints

          // 更新用户订阅信息
          await db
            .update(users)
            .set({
              stripeCustomerId: customerId,
              subscriptionId: null, // 一次性支付没有 subscription ID
              subscriptionStatus: 'active',
              subscriptionPlan: 'trial',
              subscriptionCurrentPeriodEnd: finalEndDate,
              hasTrialSubscription: true,
              points: sql`${users.points} + ${giftedPoints}`,
              giftedPoints: sql`${users.giftedPoints} + ${giftedPoints}`,
              updatedAt: new Date(),
            })
            .where(eq(users.id, currentUser.id))

          // 记录赠送积分历史
          const pointsHistoryId = uuidv4()
          await db.insert(pointsHistory).values({
            id: pointsHistoryId,
            userId: currentUser.id,
            points: giftedPoints,
            pointsType: 'gifted',
            action: 'subscription_gift',
            description: '订阅Trial赠送积分',
            createdAt: new Date(),
          })

          // 创建支付记录
          await createPaymentRecord({
            userId: currentUser.id,
            stripeCustomerId: customerId,
            checkoutSessionId: session.id,
            paymentStatus: PaymentStatus.SUCCEEDED,
            paymentType: PaymentType.SUBSCRIPTION,
            amount: session.amount_total || 0,
            currency: session.currency || 'usd',
            subscriptionPlan: 'trial',
            subscriptionPeriodStart: now,
            subscriptionPeriodEnd: finalEndDate,
            pointsAmount: giftedPoints,
            pointsType: 'gifted',
            productName: 'Trial订阅',
            productDescription: `订阅Trial，赠送${giftedPoints}积分`,
            metadata: session.metadata,
            webhookEventId: event.id,
          })

          // 发送订阅购买成功邮件
          try {
            if (customerEmail) {
              // 根据邮箱判断语言偏好（简单判断，可以根据实际需求优化）
              const locale = DEFAULT_EMAIL_LOCALE // 默认英文，可以根据实际需求调整
              await sendSubscriptionSuccessEmail(
                customerEmail,
                'Trial订阅',
                'trial',
                finalEndDate,
                session.amount_total || 0,
                session.currency || 'usd',
                locale
              )
            }
          } catch (emailError) {
            logWebhookError('Failed to send trial subscription success email:', emailError)
            // 邮件发送失败不影响主流程
          }

          // 处理推荐奖励：如果该用户是被邀请的用户，给邀请者发放订阅奖励（7天试用）
          try {
            await handleReferredUserSubscription(
              currentUser.id,
              periodDays,
              'trial'
            )
          } catch (referralError) {
            logWebhookError('Referral reward processing failed for trial subscription:', referralError)
            // 推荐奖励处理失败不影响试用订阅流程
          }

          // ========== 处理推广返利系统（完全独立于推荐系统） ==========
          // 处理首单佣金（30%）
          try {
            const orderAmount = session.amount_total || 0
            // 使用 checkout session ID 作为订单ID
            await processAffiliateCommission(
              currentUser.id,
              orderAmount,
              session.id
            )
          } catch (affiliateError) {
            logWebhookError('Affiliate commission processing failed for trial subscription:', affiliateError)
            // 推广返利处理失败不影响试用订阅流程
          }

        } catch (error) {
          logWebhookError('Trial subscription payment processing failed:', error)
          return NextResponse.json(
            { received: true, error: 'Trial subscription processing failed' },
            { status: 500 }
          )
        }
      } else if (session.mode === 'payment' && session.metadata?.type === 'points_purchase') {
        // 处理积分购买
        const userId = session.metadata.userId
        const points = parseInt(session.metadata.points)
        
        if (userId && points) {
          try {
            // 幂等性检查：是否已记录该 checkout_session
            const exists = await db
              .select()
              .from(stripePayments)
              .where(and(
                eq(stripePayments.checkoutSessionId, session.id)
              ))
              .limit(1)

            if (exists.length > 0) {
              return NextResponse.json({ received: true })
            }

            // 更新用户购买积分（永不过期）
            await db
              .update(users)
              .set({
                points: sql`${users.points} + ${points}`,
                purchasedPoints: sql`${users.purchasedPoints} + ${points}`,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userId))

            // 记录积分历史
            await db.insert(pointsHistory).values({
              id: uuidv4(),
              userId,
              points,
              pointsType: 'purchased',
              action: 'purchase',
              description: `购买积分 - 支付 $${(session.amount_total! / 100).toFixed(2)}`,
              createdAt: new Date(),
            })

            // 创建支付记录
            await createPaymentRecord({
              userId,
              stripeCustomerId: session.customer as string,
              checkoutSessionId: session.id,
              paymentStatus: PaymentStatus.SUCCEEDED,
              paymentType: PaymentType.POINTS_PURCHASE,
              amount: session.amount_total || 0,
              currency: session.currency || 'usd',
              pointsAmount: points,
              pointsType: 'purchased',
              productName: `${points.toLocaleString()} 积分`,
              productDescription: `购买 ${points.toLocaleString()} 积分`,
              priceId: session.metadata?.priceId,
              metadata: session.metadata,
              webhookEventId: event.id,
            })

            // 发送积分充值成功邮件
            try {
              const user = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1)
              if (user.length > 0 && user[0].email) {
                // 根据邮箱判断语言偏好（简单判断，可以根据实际需求优化）
                const locale = DEFAULT_EMAIL_LOCALE // 默认英文，可以根据实际需求调整
                await sendPointsPurchaseEmail(
                  user[0].email,
                  points,
                  session.amount_total || 0,
                  session.currency || 'usd',
                  locale
                )
              }
            } catch (emailError) {
              logWebhookError('Failed to send points purchase email:', emailError)
              // 邮件发送失败不影响主流程
            }

            // 注意：积分购买不参与推广返利活动

          } catch (error) {
            logWebhookError('Points purchase failed:', error)
          }
        }
      }
    }

    // ========== 处理推广返利系统退款 ==========
    // 处理退款事件
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge
      
      try {
        // 查找相关的支付记录（通过 payment_intent 或 checkout_session）
        // 注意：charge.refunded 事件中的 charge 对象可能包含 payment_intent
        const paymentIntentId = typeof charge.payment_intent === 'string' 
          ? charge.payment_intent 
          : charge.payment_intent?.id

        let paymentRecord = null
        if (paymentIntentId) {
          paymentRecord = await db
            .select()
            .from(stripePayments)
            .where(eq(stripePayments.paymentIntentId, paymentIntentId))
            .limit(1)
        }

        // 如果通过 payment_intent 没找到，尝试通过 charge.id 查找（某些情况下可能直接存储 charge.id）
        if (!paymentRecord || paymentRecord.length === 0) {
          // 尝试直接使用 charge.id 作为订单ID查找推广返利记录
          await handleAffiliateRefund(charge.id)
        } else if (paymentRecord[0]?.checkoutSessionId) {
          // 使用 checkout session ID 查找推广返利记录
          await handleAffiliateRefund(paymentRecord[0].checkoutSessionId)
        } else if (paymentIntentId) {
          // 使用 payment intent ID 查找
          await handleAffiliateRefund(paymentIntentId)
        }
      } catch (refundError) {
        logWebhookError('Affiliate refund processing failed:', refundError)
        // 退款处理失败不影响其他流程
      }
    }

    // 处理订阅更新事件
    if (event.type === 'customer.subscription.updated') {
      const webhookSubscription = event.data.object as Stripe.Subscription

      try {
        // 主动获取最新的订阅信息，而不是使用webhook中的数据
        const latestSubscription = await stripe.subscriptions.retrieve(webhookSubscription.id)

        // 获取当前用户信息，检查是否需要保持累加逻辑
        const currentUser = await db.select().from(users).where(eq(users.subscriptionId, latestSubscription.id)).limit(1)

        if (currentUser.length > 0) {
          const user = currentUser[0]
          let finalEndDate: Date

          // 检查是否是续费场景（用户已有活跃订阅且到期时间比Stripe的标准时间更晚）
          const stripeEndDate = new Date((latestSubscription as any).current_period_end * 1000)
          const userCurrentEndDate = user.subscriptionCurrentPeriodEnd

          if (userCurrentEndDate &&
              user.subscriptionStatus === 'active' &&
              userCurrentEndDate > stripeEndDate) {
            // 保持用户的累加时间，不被Stripe覆盖
            finalEndDate = userCurrentEndDate
          } else {
            // 使用Stripe的标准时间
            finalEndDate = stripeEndDate
          }

          await db
            .update(users)
            .set({
              subscriptionStatus: latestSubscription.status,
              subscriptionCurrentPeriodEnd: finalEndDate,
              updatedAt: new Date(),
            })
            .where(eq(users.subscriptionId, latestSubscription.id))
        } else {
          await db
            .update(users)
            .set({
              subscriptionStatus: latestSubscription.status,
              subscriptionCurrentPeriodEnd: (latestSubscription as any).current_period_end 
                ? new Date((latestSubscription as any).current_period_end * 1000) 
                : null,
              updatedAt: new Date(),
            })
            .where(eq(users.subscriptionId, latestSubscription.id))
        }
      } catch (error) {
        logWebhookError('Subscription update failed:', error)
      }
    }

    // 处理订阅取消事件 - 统一走过期检测 helper
    //  - 如果 currentPeriodEnd 已过:helper 会清零赠送积分 + 改 status='expired'
    //  - 如果 currentPeriodEnd 未到(用户主动取消但仍享受权益到期末):保持 active,期末由 cron/入口拦截处理
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription

      try {
        const user = await db.select().from(users).where(eq(users.subscriptionId, subscription.id)).limit(1)

        if (user.length > 0) {
          // helper 内部用乐观并发:只在到期时清零
          await expireSubscriptionIfNeeded(user[0].id)
        }
      } catch (error) {
        logWebhookError('Subscription cancellation processing failed:', error)
      }
    }

    // 处理支付失败事件
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice
      
      try {
        await db
          .update(users)
          .set({
            subscriptionStatus: 'past_due',
            updatedAt: new Date(),
          })
          .where(eq(users.stripeCustomerId, invoice.customer as string))

      } catch (error) {
        logWebhookError('Payment failure processing failed:', error)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logWebhookError('Webhook processing failed:', error)
    return NextResponse.json({ error: 'webhook_failed' }, { status: 500 })
  }
}