import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, emailVerificationTokens } from '@/lib/schema'
import { sendVerificationEmail } from '@/lib/email'
import { giveRegisterBonus } from '@/lib/points'
import {
  findReferrerByCode,
  createReferralRelation,
  checkIfAlreadyReferred,
  awardRegistrationBonus,
} from '@/lib/referral'
import {
  findAffiliateByCode,
  getOrCreateAffiliateProfile,
  createAffiliateRelation,
} from '@/lib/affiliate'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { cookies } from 'next/headers'

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
    const { name, email, password, locale, referralCode } = await request.json()

    // 从请求中获取语言信息，默认为英文（仅用于邮件内容）
    const language = (locale as 'en' | 'zh-CN' | 'ja' | 'ko' | 'zh-TW') || 'en'
    
    // 验证输入
    if (!name || !email || !password) {
      return NextResponse.json(
        { errorKey: 'missing_fields' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { errorKey: 'password_too_short' },
        { status: 400 }
      )
    }

    // 检查用户是否已存在
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    })

    if (existingUser) {
      return NextResponse.json(
        { errorKey: 'email_exists' },
        { status: 400 }
      )
    }

    // 处理推荐码
    let referrerId: string | null = null
    if (referralCode) {
      // 验证推荐码
      referrerId = await findReferrerByCode(referralCode.trim())
      if (!referrerId) {
        return NextResponse.json(
          { errorKey: 'invalid_referral_code' },
          { status: 400 }
        )
      }
      
      // 检查用户是否已被邀请（防止重复使用）
      // 注意：这里检查的是新注册的用户，所以暂时跳过
      // 实际检查会在用户创建后进行
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12)

    // 创建用户
    const userId = nanoid()
    await db.insert(users).values({
      id: userId,
      name,
      email,
      password: hashedPassword,
      referredBy: referrerId || undefined,
    })

    // 赠送注册积分（所有新用户都获得注册积分）
    try {
      await giveRegisterBonus(userId)
    } catch (pointsError) {
      console.error('Failed to give register bonus:', pointsError)
      // 积分赠送失败不影响注册流程
    }

    // 处理推荐关系（如果有推荐码，额外发放推荐奖励）
    let referralId: string | null = null
    if (referrerId) {
      try {
        // 检查是否已被邀请（虽然新用户不应该有，但为了安全还是检查）
        const alreadyReferred = await checkIfAlreadyReferred(userId)
        if (!alreadyReferred) {
          // 创建邀请关系
          referralId = await createReferralRelation(
            referrerId,
            userId,
            referralCode.trim()
          )

          // 给新用户和邀请人发放推荐奖励（各100积分，永久有效）
          await awardRegistrationBonus(userId, referralId, referrerId)
        }
      } catch (referralError) {
        console.error('Failed to process referral relation:', referralError)
        // 推荐关系处理失败不影响注册流程
      }
    }

    // ========== 处理推广返利系统（完全独立于推荐系统） ==========
    // 从 Cookie 中读取推广码（?aff={affiliateCode}）
    try {
      const cookieStore = await cookies()
      const affiliateCodeFromCookie = cookieStore.get('aff')?.value

      if (affiliateCodeFromCookie) {
        // 查找推广人
        const affiliateInfo = await findAffiliateByCode(affiliateCodeFromCookie.trim())
        
        if (affiliateInfo) {
          // 确保推广人资料存在
          const affiliateProfileId = await getOrCreateAffiliateProfile(affiliateInfo.userId)
          
          // 创建推广关系（30天有效期）
          await createAffiliateRelation(affiliateProfileId, userId)
          
          // 注意：这里不删除 Cookie，因为 Cookie 本身有 30 天过期时间
          // 如果需要立即删除，可以在这里删除：cookieStore.delete('aff')
        }
      }
    } catch (affiliateError) {
      console.error('Failed to process affiliate relation:', affiliateError)
      // 推广关系处理失败不影响注册流程
    }

    // 生成邮箱验证令牌
    const verificationToken = nanoid(32)
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期

    await db.insert(emailVerificationTokens).values({
      id: nanoid(),
      email,
      token: verificationToken,
      expires,
    })

    // 获取客户端IP地址
    const clientIP = getClientIP(request)

    // 发送验证邮件（根据语言）
    const emailResult = await sendVerificationEmail(email, verificationToken, language as 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko', clientIP)

    if (!emailResult.success) {
      // 如果是频率限制错误，返回429状态码
      if (emailResult.error?.includes('频繁') || emailResult.error?.includes('Too many')) {
        return NextResponse.json(
          { errorKey: 'rate_limit' },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { errorKey: 'verification_email_failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      messageKey: 'register_success_check_email',
      success: true
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { errorKey: 'register_retry' },
      { status: 500 }
    )
  }
} 