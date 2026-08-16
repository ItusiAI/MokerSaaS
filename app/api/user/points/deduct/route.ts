import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, pointsHistory } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    // 验证用户登录状态
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'not_logged_in_alt' },
        { status: 401 }
      )
    }

    const { points, description, type } = await request.json()

    // 验证参数
    if (!points || points <= 0) {
      return NextResponse.json(
        { success: false, error: 'points_invalid_amount' },
        { status: 400 }
      )
    }

    if (!description || !type) {
      return NextResponse.json(
        { success: false, error: 'points_missing_params' },
        { status: 400 }
      )
    }

    // 查找用户
    const userList = await db
      .select({
        id: users.id,
        points: users.points
      })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1)

    const user = userList[0]
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'user_not_found' },
        { status: 404 }
      )
    }

    // 检查积分是否足够
    if ((user.points || 0) < points) {
      return NextResponse.json(
        { success: false, error: 'points_insufficient' },
        { status: 400 }
      )
    }

    // 扣除积分并记录历史（不使用事务，因为neon-http不支持）
    const newPoints = (user.points || 0) - points

    // 1. 扣除积分
    await db
      .update(users)
      .set({
        points: newPoints,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))

    // 2. 记录积分历史
    await db.insert(pointsHistory).values({
      id: nanoid(),
      userId: user.id,
      points: -points, // 负数表示扣除
      pointsType: 'purchased', // 默认扣除购买的积分
      action: type,
      description: description,
      createdAt: new Date()
    })

    const result = { points: newPoints }

    return NextResponse.json({
      success: true,
      message: 'points_deducted_successfully',
      data: {
        deductedPoints: points,
        remainingPoints: result.points,
        description: description
      }
    })

  } catch (error) {
    console.error('积分扣除失败:', error)
    return NextResponse.json(
      { success: false, error: 'server_internal_error' },
      { status: 500 }
    )
  }
}
