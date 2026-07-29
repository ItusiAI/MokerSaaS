import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq, and, gt } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { errorKey: 'token_invalid' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { errorKey: 'password_min_length' },
        { status: 400 }
      )
    }

    // 查找具有有效重置令牌的用户
    const user = await db.select().from(users).where(
      and(
        eq(users.resetToken, token),
        gt(users.resetTokenExpiry, new Date())
      )
    ).limit(1)

    if (user.length === 0) {
      return NextResponse.json(
        { errorKey: 'token_invalid' },
        { status: 400 }
      )
    }

    // 哈希新密码
    const hashedPassword = await bcrypt.hash(password, 12)

    // 更新用户密码并清除重置令牌
    await db.update(users)
      .set({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      })
      .where(eq(users.id, user[0].id))

    return NextResponse.json(
      { messageKey: 'success_message' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { errorKey: 'reset_failed' },
      { status: 500 }
    )
  }
} 