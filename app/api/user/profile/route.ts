import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, sessions } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      )
    }

    // 获取用户详细信息
    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        image: users.image,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (!user[0]) {
      return NextResponse.json(
        { error: 'user_not_found' },
        { status: 404 }
      )
    }

    // 获取用户最后登录时间（从sessions表中获取最新的session）
    const lastSession = await db
      .select({
        expires: sessions.expires,
      })
      .from(sessions)
      .where(eq(sessions.userId, session.user.id))
      .orderBy(desc(sessions.expires))
      .limit(1)

    return NextResponse.json({
      success: true,
      user: {
        ...user[0],
        lastLoginAt: lastSession[0]?.expires || user[0].createdAt
      }
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return NextResponse.json(
      { error: 'server_error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'name_required' },
        { status: 400 }
      )
    }

    // 更新用户信息
    await db
      .update(users)
      .set({
        name: name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))

    return NextResponse.json({
      success: true,
      message: 'profile_updated',
    })
  } catch (error) {
    console.error('更新个人信息失败:', error)
    return NextResponse.json(
      { error: 'server_error' },
      { status: 500 }
    )
  }
} 