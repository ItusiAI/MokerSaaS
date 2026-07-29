import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, pointsHistory, stripePayments } from '@/lib/schema'
import { eq, desc, like, or, count, sum, sql, and, isNotNull, isNull } from 'drizzle-orm'
import { isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminAccess = await isAdmin()
    if (!adminAccess) {
      return NextResponse.json(
        { error: '需要管理员权限' },
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
        // 总用户数
        db.select({ count: count() }).from(users),
        // 已验证邮箱用户数
        db.select({ count: count() }).from(users).where(isNotNull(users.emailVerified)),
        // 管理员用户数
        db.select({ count: count() }).from(users).where(eq(users.role, 'admin')),
        // 订阅用户数
        db.select({ count: count() }).from(users).where(eq(users.subscriptionStatus, 'active')),
        // 总积分数
        db.select({ total: sum(users.points) }).from(users),
        // 总支付金额
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
      // 构建查询条件
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

      // 获取总数用于分页（先获取，因为可能在更新过期订阅后需要用到）
      const totalCount = await db
        .select({ count: count() })
        .from(users)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)

      // 获取用户列表
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
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset)

      // 检查并更新过期订阅
      const now = new Date()
      const expiredUserIds: string[] = []
      
      for (const user of usersList) {
        // 检查订阅是否过期
        if (
          user.subscriptionStatus === 'active' &&
          user.subscriptionCurrentPeriodEnd &&
          new Date(user.subscriptionCurrentPeriodEnd) < now
        ) {
          expiredUserIds.push(user.id)
        }
      }

      // 批量更新过期订阅
      if (expiredUserIds.length > 0) {
        const { pointsHistory } = await import('@/lib/schema')
        const { v4: uuidv4 } = await import('uuid')

        // 逐个更新过期订阅
        for (const userId of expiredUserIds) {
          // 获取用户信息
          const userData = await db
            .select({
              id: users.id,
              giftedPoints: users.giftedPoints,
              points: users.points,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)

          if (userData.length === 0) continue

          const expiredUser = userData[0]
          const hasGiftedPoints = (expiredUser.giftedPoints || 0) > 0

          // 更新过期订阅状态
          if (hasGiftedPoints) {
            // 清零赠送积分
            await db
              .update(users)
              .set({
                subscriptionStatus: null, // 恢复为未订阅状态
                subscriptionPlan: null,
                points: sql`${users.points} - ${expiredUser.giftedPoints || 0}`,
                giftedPoints: 0,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userId))

            // 记录积分清零历史
            await db.insert(pointsHistory).values({
              id: uuidv4(),
              userId: expiredUser.id,
              points: -(expiredUser.giftedPoints || 0),
              pointsType: 'gifted',
              action: 'subscription_expired',
              description: '订阅到期自动清零赠送积分',
              createdAt: new Date(),
            })
          } else {
            // 只更新状态，不清零积分
            await db
              .update(users)
              .set({
                subscriptionStatus: null, // 恢复为未订阅状态
                subscriptionPlan: null,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userId))
          }
        }

        // 重新获取更新后的用户列表
        const updatedUsersList = await db
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
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
          .orderBy(desc(users.createdAt))
          .limit(limit)
          .offset(offset)

        return NextResponse.json({
          users: updatedUsersList,
          pagination: {
            page,
            limit,
            total: totalCount[0]?.count || 0,
            totalPages: Math.ceil((totalCount[0]?.count || 0) / limit)
          }
        })
      }

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
    // 验证管理员权限
    const adminAccess = await isAdmin()
    if (!adminAccess) {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      )
    }

    const { userId, updates } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: '用户ID是必需的' },
        { status: 400 }
      )
    }

    // 更新用户信息
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
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: '用户信息更新成功',
      user: result[0]
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
