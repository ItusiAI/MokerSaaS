import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { affiliateProfiles, affiliateRelations, users } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { getOrCreateAffiliateProfile } from '@/lib/affiliate'

/**
 * 获取邀请数据列表
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 获取推广资料ID
    const profileId = await getOrCreateAffiliateProfile(userId)

    // 获取邀请关系列表（带分页）
    const relations = await db
      .select({
        id: affiliateRelations.id,
        inviteeId: affiliateRelations.inviteeId,
        expiresAt: affiliateRelations.expiresAt,
        hasConverted: affiliateRelations.hasConverted,
        createdAt: affiliateRelations.createdAt,
        // 被邀请人信息
        inviteeName: users.name,
        inviteeEmail: users.email,
        inviteeImage: users.image,
        inviteeCreatedAt: users.createdAt,
      })
      .from(affiliateRelations)
      .innerJoin(users, eq(affiliateRelations.inviteeId, users.id))
      .where(eq(affiliateRelations.referrerId, profileId))
      .orderBy(desc(affiliateRelations.createdAt))
      .limit(limit)
      .offset(offset)

    // 获取总数
    const totalRelations = await db
      .select()
      .from(affiliateRelations)
      .where(eq(affiliateRelations.referrerId, profileId))

    return NextResponse.json({
      success: true,
      data: relations.map((r) => ({
        id: r.id,
        invitee: {
          id: r.inviteeId,
          name: r.inviteeName,
          email: r.inviteeEmail,
          image: r.inviteeImage,
          createdAt: r.inviteeCreatedAt,
        },
        expiresAt: r.expiresAt,
        hasConverted: r.hasConverted,
        createdAt: r.createdAt,
        isExpired: r.expiresAt < new Date(),
      })),
      pagination: {
        page,
        limit,
        total: totalRelations.length,
        totalPages: Math.ceil(totalRelations.length / limit),
      },
    })
  } catch (error) {
    console.error('Failed to get affiliate relations:', error)
    return NextResponse.json(
      { error: 'Failed to get affiliate relations' },
      { status: 500 }
    )
  }
}


