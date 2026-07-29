import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import {
  findAffiliateByCode,
  getOrCreateAffiliateProfile,
  createAffiliateRelation,
} from '@/lib/affiliate'

/**
 * 处理OAuth登录后的推广返利关系
 * 在OAuth登录成功后，检查cookie中的推广返利码并处理推广关系
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { affiliateCode } = await request.json()

    if (!affiliateCode) {
      return NextResponse.json(
        { error: 'Affiliate code is required' },
        { status: 400 }
      )
    }

    const userId = session.user.id

    // 检查用户是否存在
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 查找推广人
    const affiliateInfo = await findAffiliateByCode(affiliateCode.trim())
    if (!affiliateInfo) {
      return NextResponse.json(
        { error: 'Invalid affiliate code' },
        { status: 400 }
      )
    }

    // 不能自己推广自己
    if (affiliateInfo.userId === userId) {
      return NextResponse.json(
        { error: 'Cannot use your own affiliate code' },
        { status: 400 }
      )
    }

    // 检查是否已经存在推广关系
    const { affiliateRelations } = await import('@/lib/schema')
    const existingRelation = await db
      .select()
      .from(affiliateRelations)
      .where(eq(affiliateRelations.inviteeId, userId))
      .limit(1)

    // 如果已经存在关系，直接返回成功（避免重复创建）
    if (existingRelation.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Affiliate relationship already exists'
      })
    }

    // 检查用户是否是新注册的（创建时间在最近30分钟内）
    // 放宽时间限制，因为OAuth回调可能有延迟，且用户可能在注册后一段时间才登录
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    const isNewUser = user.createdAt && new Date(user.createdAt) >= thirtyMinutesAgo

    if (!isNewUser) {
      // 如果不是新用户，但关系已存在，直接返回成功
      if (existingRelation.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'Affiliate relationship already exists'
        })
      }
      return NextResponse.json(
        { error: 'Affiliate code can only be applied for new registrations' },
        { status: 400 }
      )
    }

    // 确保推广人资料存在
    const affiliateProfileId = await getOrCreateAffiliateProfile(affiliateInfo.userId)
    
    // 创建推广关系（30天有效期）
    // createAffiliateRelation 内部会检查是否已存在，所以这里可以安全调用
    await createAffiliateRelation(affiliateProfileId, userId)

    return NextResponse.json({
      success: true,
      message: 'Affiliate relationship created successfully'
    })

  } catch (error) {
    console.error('OAuth affiliate processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process affiliate' },
      { status: 500 }
    )
  }
}

