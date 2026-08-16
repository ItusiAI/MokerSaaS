import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { affiliateProfiles, affiliateEarnings, affiliateRelations, users } from '@/lib/schema'
import { eq, desc, and } from 'drizzle-orm'
import { getOrCreateAffiliateProfile, releaseFrozenFunds } from '@/lib/affiliate'

/**
 * 获取佣金记录列表
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') // FROZEN, RELEASED, CANCELLED
    const offset = (page - 1) * limit

    // 获取推广资料ID
    const profileId = await getOrCreateAffiliateProfile(userId)

    // 自动检测并解冻到期的资金
    await releaseFrozenFunds(profileId)

    // 构建查询条件
    const conditions = [eq(affiliateEarnings.affiliateId, profileId)]
    if (status) {
      conditions.push(eq(affiliateEarnings.status, status))
    }

    // 获取佣金记录列表（带分页）
    const earnings = await db
      .select({
        id: affiliateEarnings.id,
        amount: affiliateEarnings.amount,
        status: affiliateEarnings.status,
        releaseDate: affiliateEarnings.releaseDate,
        stripeOrderId: affiliateEarnings.stripeOrderId,
        createdAt: affiliateEarnings.createdAt,
        updatedAt: affiliateEarnings.updatedAt,
        // 关联的邀请人信息（如果有）
        inviteeId: affiliateRelations.inviteeId,
        inviteeName: users.name,
        inviteeEmail: users.email,
      })
      .from(affiliateEarnings)
      .leftJoin(affiliateRelations, eq(affiliateEarnings.relationId, affiliateRelations.id))
      .leftJoin(users, eq(affiliateRelations.inviteeId, users.id))
      .where(and(...conditions))
      .orderBy(desc(affiliateEarnings.createdAt))
      .limit(limit)
      .offset(offset)

    // 获取总数
    const totalEarnings = await db
      .select()
      .from(affiliateEarnings)
      .where(and(...conditions))

    return NextResponse.json({
      success: true,
      data: earnings.map((e) => ({
        id: e.id,
        amount: e.amount,
        status: e.status,
        releaseDate: e.releaseDate,
        stripeOrderId: e.stripeOrderId,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        invitee: e.inviteeId
          ? {
              id: e.inviteeId,
              name: e.inviteeName,
              email: e.inviteeEmail,
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total: totalEarnings.length,
        totalPages: Math.ceil(totalEarnings.length / limit),
      },
    })
  } catch (error) {
    console.error('Failed to get affiliate earnings:', error)
    return NextResponse.json(
      { error: 'failed_to_get_affiliate_earnings' },
      { status: 500 }
    )
  }
}


