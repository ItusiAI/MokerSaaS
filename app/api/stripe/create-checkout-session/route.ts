import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // 检查Stripe是否已配置
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { points, amount, priceId } = await request.json()

    if (!points || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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

    // 创建line items - 优先使用价格ID
    let lineItems
    if (priceId && priceId.trim() !== '') {
      // 使用预定义的价格ID
      lineItems = [
        {
          price: priceId,
          quantity: 1,
        },
      ]
    } else {
      // 使用动态价格创建（向后兼容）
      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${points.toLocaleString()} Points`,
              description: `Purchase ${points.toLocaleString()} points for your account`,
            },
            unit_amount: amount, // 金额已经是分为单位
          },
          quantity: 1,
        },
      ]
    }

    // 创建结账会话
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      // 启用自动发票创建 - Stripe会自动发送发票给客户
      invoice_creation: {
        enabled: true,
      },
      // 启用发票邮件 - Stripe会自动发送发票邮件给客户
      billing_address_collection: 'required',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?payment=cancelled`,
      metadata: {
        userId: session.user.id || '',
        points: points.toString(),
        type: 'points_purchase',
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Stripe checkout session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 