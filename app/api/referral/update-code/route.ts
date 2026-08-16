import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      )
    }

    const { customCode } = await req.json()

    // 验证推荐码格式（4-20个字符，仅支持字母和数字）
    if (!customCode || typeof customCode !== 'string') {
      return NextResponse.json(
        { error: 'referral_code_required' },
        { status: 400 }
      )
    }

    const code = customCode.trim()
    
    // 验证长度和格式
    if (code.length < 4 || code.length > 20) {
      return NextResponse.json(
        { error: 'referral_code_length' },
        { status: 400 }
      )
    }

    if (!/^[A-Za-z0-9]+$/.test(code)) {
      return NextResponse.json(
        { error: 'referral_code_invalid_chars' },
        { status: 400 }
      )
    }

    // 检查用户是否已经修改过推荐码
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (!currentUser) {
      return NextResponse.json(
        { error: 'user_not_found' },
        { status: 404 }
      )
    }

    // 仅允许修改一次
    if (currentUser.referralCodeChanged) {
      return NextResponse.json(
        { error: 'referral_code_already_changed' },
        { status: 400 }
      )
    }

    // 检查推荐码是否已被使用
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, code))
      .limit(1)

    if (existingUser) {
      return NextResponse.json(
        { error: 'referral_code_already_taken' },
        { status: 400 }
      )
    }

    // 更新用户的推荐码，并标记已修改过一次
    await db
      .update(users)
      .set({ 
        referralCode: code,
        referralCodeChanged: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, session.user.id))

    return NextResponse.json({
      success: true,
      referralCode: code
    })
  } catch (error) {
    console.error('Error updating referral code:', error)
    return NextResponse.json(
      { error: 'server_error' },
      { status: 500 }
    )
  }
}

