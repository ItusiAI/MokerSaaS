import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { sendPasswordResetEmail } from '@/lib/email'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

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
    const { email, locale } = await request.json()

    // 从请求中获取语言信息，默认为英文
    const language = locale || 'en'

    if (!email) {
      return NextResponse.json(
        { errorKey: 'email_required' },
        { status: 400 }
      )
    }

    // 查找用户
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1)

    if (user.length === 0) {
      return NextResponse.json(
        { errorKey: 'user_not_found' },
        { status: 404 }
      )
    }

    // 生成重置令牌
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期

    // 保存重置令牌到数据库
    await db.update(users)
      .set({
        resetToken,
        resetTokenExpiry
      })
      .where(eq(users.email, email))

    // 获取客户端IP地址
    const clientIP = getClientIP(request)

    // 发送重置密码邮件（根据语言）
    const emailResult = await sendPasswordResetEmail(email, resetToken, language as 'en' | 'zh' | 'ja' | 'ko' | 'tw', clientIP)

    if (!emailResult.success) {
      // 如果是频率限制错误，返回429状态码
      if (emailResult.error?.includes('频繁') || emailResult.error?.includes('Too many')) {
        return NextResponse.json(
          { errorKey: 'rate_limit' },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { errorKey: 'send_failed' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { messageKey: 'success_message' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { errorKey: 'send_failed' },
      { status: 500 }
    )
  }
} 