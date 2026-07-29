import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, emailVerificationTokens } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { sendVerificationEmail } from '@/lib/email'

// 获取客户端IP地址
function getClientIP(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip') // Cloudflare
  
  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (forwarded) return forwarded.split(',')[0].trim()
  
  return undefined
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 获取用户信息
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
      columns: {
        id: true,
        email: true,
        emailVerified: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 检查邮箱是否已验证
    if (user.emailVerified) {
      return NextResponse.json(
        { error: '邮箱已验证，无需重复验证' },
        { status: 400 }
      )
    }

    // 删除该用户之前的验证令牌
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.email, user.email))

    // 生成新的验证令牌
    const token = uuidv4()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期

    // 保存新的验证令牌
    await db.insert(emailVerificationTokens).values({
      id: uuidv4(),
      email: user.email,
      token,
      expires,
    })

    // 获取用户语言偏好
    const { locale = 'en' } = await request.json().catch(() => ({ locale: 'en' }))

    // 获取客户端IP地址
    const clientIP = getClientIP(request)

    // 发送验证邮件
    const emailResult = await sendVerificationEmail(user.email, token, locale as 'zh' | 'en', clientIP)

    if (!emailResult.success) {
      console.error('发送验证邮件失败:', emailResult.error)
      // 如果是频率限制错误，返回429状态码
      if (emailResult.error?.includes('频繁') || emailResult.error?.includes('Too many')) {
        return NextResponse.json(
          { error: emailResult.error },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: '发送验证邮件失败，请稍后重试' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '验证邮件已发送，请检查您的邮箱'
    })

  } catch (error) {
    console.error('重发验证邮件失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
