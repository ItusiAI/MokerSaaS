import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // 跟随 stripe-node SDK v12+ 默认对齐的 API 版本
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      )
    }

    // 获取用户的Stripe客户ID
    const user = await db.select({
      stripeCustomerId: users.stripeCustomerId
    }).from(users).where(eq(users.id, session.user.id)).limit(1)

    const userData = user[0]

    if (!userData?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'no_stripe_customer_found' },
        { status: 404 }
      )
    }

    // 获取请求体中的返回URL
    const body = await request.json()
    const { returnUrl } = body

    // 创建客户门户会话
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/profile`,
    })

    return NextResponse.json({
      url: portalSession.url
    })

  } catch (error) {
    console.error('Customer portal creation error:', error)
    return NextResponse.json(
      { error: 'failed_to_create_customer_portal_session' },
      { status: 500 }
    )
  }
}
