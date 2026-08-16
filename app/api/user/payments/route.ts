import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPaymentHistory, getUserPaymentStats, PaymentType, PaymentStatus } from '@/lib/payments'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const paymentType = searchParams.get('paymentType') as PaymentType | null
    const paymentStatus = searchParams.get('paymentStatus') as PaymentStatus | null
    const includeStats = searchParams.get('includeStats') === 'true'

    // 获取支付记录
    const payments = await getUserPaymentHistory(session.user.id, {
      limit,
      offset,
      paymentType: paymentType || undefined,
      paymentStatus: paymentStatus || undefined,
    })

    // 如果需要统计数据
    let stats = null
    if (includeStats) {
      stats = await getUserPaymentStats(session.user.id)
    }

    return NextResponse.json({
      success: true,
      data: {
        payments,
        stats,
        pagination: {
          limit,
          offset,
          total: payments.length,
        }
      }
    })
  } catch (error) {
    console.error('获取支付记录失败:', error)
    return NextResponse.json(
      { error: 'failed_to_fetch_payment_history' },
      { status: 500 }
    )
  }
} 