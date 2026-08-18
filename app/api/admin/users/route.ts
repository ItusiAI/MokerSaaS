import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, stripePayments } from '@/lib/schema'
import { eq, desc, like, or, count, sum, sql, and, isNotNull, isNull } from 'drizzle-orm'
import { isAdmin } from '@/lib/auth-utils'
import { expireAllOverdueSubscriptions } from '@/lib/subscription'

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminAccess = await isAdmin()
    if (!adminAccess) {
      return NextResponse.json(
        { error: 'admin_required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const emailVerified = searchParams.get('emailVerified') || ''
    const subscriptionStatus = searchParams.get('subscriptionStatus') || ''

    if (action === 'stats') {
      // 获取用户统计数据
      const [
        totalUsers,
        verifiedUsers,
        adminUsers,
        subscribedUsers,
        totalPoints,
        totalPayments
      ] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(users).where(isNotNull(users.emailVerified)),
        db.select({ count: count() }).from(users).where(eq(users.role, 'admin')),
        db.select({ count: count() }).from(users).where(eq(users.subscriptionStatus, 'active')),
        db.select({ total: sum(users.points) }).from(users),
        db.select({ total: sum(stripePayments.amount) }).from(stripePayments).where(eq(stripePayments.paymentStatus, 'succeeded'))
      ])

      return NextResponse.json({
        totalUsers: totalUsers[0]?.count || 0,
        verifiedUsers: verifiedUsers[0]?.count || 0,
        adminUsers: adminUsers[0]?.count || 0,
        subscribedUsers: subscribedUsers[0]?.count || 0,
        totalPoints: totalPoints[0]?.total || 0,
        totalPayments: totalPayments[0]?.total || 0,
      })
    }

    if (action === 'list') {
      // 进入列表前:统一批量处理已过期订阅(由 helper 完成清零)
      // 这是兜底机制,真正日常清零依赖 cron 和入口拦截
      await expireAllOverdueSubscriptions()

      let whereConditions = []

      if (search) {
        whereConditions.push(
          or(
            like(users.email, `%${search}%`),
            like(users.name, `%${search}%`)
          )
        )
      }

      if (role) {
        whereConditions.push(eq(users.role, role))
      }

      if (emailVerified === 'true') {
        whereConditions.push(isNotNull(users.emailVerified))
      } else if (emailVerified === 'false') {
        whereConditions.push(isNull(users.emailVerified))
      }

      if (subscriptionStatus) {
        if (subscriptionStatus === 'none') {
          whereConditions.push(isNull(users.subscriptionStatus))
        } else {
          whereConditions.push(eq(users.subscriptionStatus, subscriptionStatus))
        }
      }

      const totalCount = await db
        .select({ count: count() })
        .from(users)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)

      const offset = (page - 1) * limit
      const usersList = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          emailVerified: users.emailVerified,
          role: users.role,
          points: users.points,
          purchasedPoints: users.purchasedPoints,
          giftedPoints: users.giftedPoints,
          subscriptionStatus: users.subscriptionStatus,
          subscriptionPlan: users.subscriptionPlan,
          subscriptionCurrentPeriodEnd: users.subscriptionCurrentPeriodEnd,
          subscriptionReminderDisabled: users.subscriptionReminderDisabled,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset)

      return NextResponse.json({
        users: usersList,
        pagination: {
          page,
          limit,
          total: totalCount[0]?.count || 0,
          totalPages: Math.ceil((totalCount[0]?.count || 0) / limit)
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminAccess = await isAdmin()
    if (!adminAccess) {
      return NextResponse.json(
        { error: 'admin_required' },
        { status: 403 }
      )
    }

    const { userId, updates } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id_required' },
        { status: 400 }
      )
    }

    const result = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning()

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'user_not_found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'user_updated',
      user: result[0]
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'server_error' },
      { status: 500 }
    )
  }
}