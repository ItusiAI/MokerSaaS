import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPointsHistory, getUserPointsHistoryCount } from '@/lib/points'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'not_logged_in' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '5')
    const offset = (page - 1) * limit

    // 获取分页历史记录
    const history = await getUserPointsHistory(session.user.id, limit, offset)
    
    // 获取总记录数
    const total = await getUserPointsHistoryCount(session.user.id)
    
    // 计算总页数
    const totalPages = Math.ceil(total / limit)
    
    return NextResponse.json({
      success: true,
      history,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    })
  } catch (error) {
    console.error('获取积分历史失败:', error)
    return NextResponse.json(
      { error: 'fetch_points_history_failed' },
      { status: 500 }
    )
  }
} 