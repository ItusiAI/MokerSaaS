import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { affiliateProfiles, affiliateRelations, affiliateEarnings, users } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getOrCreateAffiliateProfile, getAffiliateStats, releaseFrozenFunds } from '@/lib/affiliate'

/**
 * 获取推广返利统计信息
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

    // 获取或创建推广资料
    const profileId = await getOrCreateAffiliateProfile(userId)
    
    // 自动检测并解冻到期的资金
    await releaseFrozenFunds(profileId)
    
    // 获取推广资料
    const profile = await db
      .select()
      .from(affiliateProfiles)
      .where(eq(affiliateProfiles.id, profileId))
      .limit(1)

    if (profile.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // 获取统计信息
    const stats = await getAffiliateStats(profileId)

    if (!stats) {
      return NextResponse.json(
        { error: 'Stats not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      stats: {
        code: stats.profile.code,
        codeChanged: stats.profile.codeChanged,
        canEdit: !stats.profile.codeChanged, // 如果未修改过，可以编辑
        balance: stats.profile.balance,
        frozenBalance: stats.profile.frozenBalance,
        totalRelations: stats.totalRelations,
        convertedRelations: stats.convertedRelations,
        totalEarnings: stats.totalEarnings,
        releasedEarnings: stats.releasedEarnings,
        frozenEarnings: stats.frozenEarnings,
      },
    })
  } catch (error) {
    console.error('Failed to get affiliate stats:', error)
    return NextResponse.json(
      { error: 'Failed to get affiliate stats' },
      { status: 500 }
    )
  }
}


