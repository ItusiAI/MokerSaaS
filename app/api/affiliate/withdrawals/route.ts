import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOrCreateAffiliateProfile, getWithdrawals } from '@/lib/affiliate'

/**
 * 获取提现记录列表
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

    // 获取推广资料ID
    const profileId = await getOrCreateAffiliateProfile(userId)

    // 获取提现记录
    const result = await getWithdrawals(profileId, page, limit)

    return NextResponse.json({
      success: true,
      data: result.data.map((w) => ({
        id: w.id,
        amount: w.amount,
        status: w.status,
        paymentMethod: w.paymentMethod,
        accountName: w.accountName,
        accountInfo: w.accountInfo,
        transactionId: w.transactionId,
        failureReason: w.failureReason,
        processedAt: w.processedAt,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      })),
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('Failed to get withdrawals:', error)
    return NextResponse.json(
      { error: 'failed_to_get_withdrawals' },
      { status: 500 }
    )
  }
}

