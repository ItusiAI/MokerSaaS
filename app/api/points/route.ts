import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPoints, addPoints, deductPoints, PointsAction } from '@/lib/points'
import { isAdmin } from '@/lib/auth-utils'

// 获取当前用户积分
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'not_logged_in' },
        { status: 401 }
      )
    }

    const points = await getUserPoints(session.user.id)
    
    return NextResponse.json({
      points,
      userId: session.user.id,
      email: session.user.email,
    })
  } catch (error) {
    console.error('获取积分失败:', error)
    return NextResponse.json(
      { error: 'fetch_points_failed' },
      { status: 500 }
    )
  }
}

// 管理员操作：添加或扣除积分
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminAccess = await isAdmin()
    if (!adminAccess) {
      return NextResponse.json(
        { error: 'admin_required' },
        { status: 403 }
      )
    }

    const { userId, points, action, operation } = await request.json()
    
    if (!userId || !points || !operation) {
      return NextResponse.json(
        { error: 'points_missing_params' },
        { status: 400 }
      )
    }

    let result
    if (operation === 'add') {
      result = await addPoints(userId, points, action || PointsAction.MANUAL)
    } else if (operation === 'deduct') {
      result = await deductPoints(userId, points)
    } else {
      return NextResponse.json(
        { error: 'invalid_operation_type' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'points_operation_success',
      newPoints: result,
      success: true
    })
  } catch (error) {
    console.error('积分操作失败:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'points_operation_failed'
      },
      { status: 500 }
    )
  }
} 