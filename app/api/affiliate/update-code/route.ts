import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateAffiliateCode } from '@/lib/affiliate'

/**
 * 更新推广码（只能修改一次）
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

    const { code } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'CODE_EMPTY' },
        { status: 400 }
      )
    }

    const result = await updateAffiliateCode(session.user.id, code)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'UPDATE_FAILED' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      code: result.code,
    })
  } catch (error) {
    console.error('Failed to update affiliate code:', error)
    return NextResponse.json(
      { error: 'UPDATE_FAILED' },
      { status: 500 }
    )
  }
}


