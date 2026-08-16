import { NextRequest, NextResponse } from 'next/server'
import { stripe, getActualPriceIds } from '@/lib/stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'

export async function POST(request: NextRequest) {
  try {
    // 检查Stripe是否已配置
    if (!stripe) {
      return NextResponse.json({ error: 'stripe_not_configured' }, { status: 500 })
    }

    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { priceId, planType, locale = 'en' } = await request.json()
    const validLocales = ['en', 'zh', 'ja', 'ko', 'tw']
    const validLocale = validLocales.includes(locale) ? locale : 'en'
    const t = await getTranslations({ locale: validLocale, namespace: 'stripe_checkout' })

    // 获取实际的价格ID
    const actualPriceIds = getActualPriceIds()

    // 添加调试日志
    console.log('=== Stripe Checkout Debug ===')
    console.log('收到的价格ID:', priceId)
    console.log('计划类型:', planType)
    console.log('语言:', locale)
    console.log('实际的价格ID配置:', actualPriceIds)

    // 企业版不支持在线支付
    if (planType === 'enterprise') {
      return NextResponse.json({ error: 'enterprise_contact_sales' }, { status: 400 })
    }

    // 获取用户当前订阅状态
    const user = await db
      .select({ 
        hasTrialSubscription: users.hasTrialSubscription,
        subscriptionStatus: users.subscriptionStatus,
        subscriptionPlan: users.subscriptionPlan,
        subscriptionCurrentPeriodEnd: users.subscriptionCurrentPeriodEnd,
        subscriptionId: users.subscriptionId,
      })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1)

    const currentUser = user.length > 0 ? user[0] : null
    const now = new Date()
    const hasActiveSubscription = currentUser?.subscriptionStatus === 'active' &&
      currentUser?.subscriptionCurrentPeriodEnd &&
      new Date(currentUser.subscriptionCurrentPeriodEnd) > now

    // 如果是试用订阅，检查用户是否已经订阅过或已有pro/annual订阅
    if (planType === 'trial') {
      if (currentUser) {
        // 检查是否已经订阅过试用版
        if (currentUser.hasTrialSubscription) {
          return NextResponse.json(
            { error: t('trial_already_used') },
            { status: 400 }
          )
        }
        
        // 检查是否已经有active的pro或annual订阅
        const hasActiveProOrAnnual = hasActiveSubscription &&
          (currentUser.subscriptionPlan === 'pro' || currentUser.subscriptionPlan === 'annual')
        
        if (hasActiveProOrAnnual) {
          return NextResponse.json(
            { error: t('trial_blocked_for_paid') },
            { status: 400 }
          )
        }
      }
    }

    // 如果是pro订阅，检查用户是否有active的annual订阅（不能降级）
    if (planType === 'pro') {
      if (currentUser && hasActiveSubscription && currentUser.subscriptionPlan === 'annual') {
        return NextResponse.json(
          { error: t('annual_no_downgrade') },
          { status: 400 }
        )
      }
    }

    // 如果是annual订阅，检查用户是否有active的annual订阅（可以续费）
    if (planType === 'annual') {
      // annual没到期可以续费，所以这里不做限制
      // trial和pro可以升级到annual，所以也不做限制
    }

    // 确定要使用的价格ID
    let finalPriceId = priceId
    
    // 如果前端传递的价格ID为空或无效，使用服务端的配置
    if (!priceId || priceId.trim() === '') {
      if (planType === 'trial') {
        finalPriceId = actualPriceIds.trial
      } else if (planType === 'pro') {
        finalPriceId = actualPriceIds.pro
      } else if (planType === 'annual') {
        finalPriceId = actualPriceIds.annual
      } else {
        return NextResponse.json({ error: 'missing_price_id_for_plan' }, { status: 400 })
      }
    }

    // 验证最终的价格ID
    if (!finalPriceId || finalPriceId.trim() === '') {
      console.error('价格ID验证失败!')
      console.error('计划类型:', planType)
      console.error('最终价格ID:', finalPriceId)
      console.error('可用的价格ID:', actualPriceIds)
      return NextResponse.json({ error: 'price_id_not_configured' }, { status: 400 })
    }

    console.log('使用的最终价格ID:', finalPriceId)

    // 创建或获取客户
    let customer
    const existingCustomers = await stripe.customers.list({
      email: session.user.email,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
      })
    }

    // 验证locale并构建成功URL
    // (validLocale already computed above for translations)
    
    // 创建结账会话配置
    // 试用订阅使用一次性支付模式（payment），其他使用订阅模式（subscription）
    const checkoutSessionConfig: any = {
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      mode: planType === 'trial' ? 'payment' : 'subscription',
      // 启用自动发票创建 - Stripe会自动发送发票给客户
      invoice_creation: {
        enabled: true,
      },
      // 启用发票邮件 - Stripe会自动发送发票邮件给客户
      billing_address_collection: 'required',
      // 自动税务计算（可选，如果需要）
      // automatic_tax: { enabled: true },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/${validLocale}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/${validLocale}/#pricing`,
      metadata: {
        userId: session.user.id || '',
        planType,
        locale: validLocale,
      },
    }

    // 如果是annual订阅且用户已有active订阅，处理升级/续费
    if (planType === 'annual' && currentUser && hasActiveSubscription && currentUser.subscriptionId) {
      // 如果是续费（已有annual订阅），或者升级（从trial/pro升级到annual）
      // Stripe会自动处理订阅的升级/续费
      // 这里可以添加额外的逻辑，比如取消旧订阅等
      // 但通常Stripe会在新订阅创建时自动处理
    }
    
    // 创建结账会话
    const checkoutSession = await stripe.checkout.sessions.create(checkoutSessionConfig)

    return NextResponse.json({ sessionId: checkoutSession.id })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'server_internal_error' },
      { status: 500 }
    )
  }
} 