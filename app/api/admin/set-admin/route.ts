import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json(
        { error: 'set_admin_email_required_query' },
        { status: 400 }
      )
    }

    // 更新用户角色为管理员
    const result = await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.email, email))
      .returning()

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'user_not_found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      messageKey: 'user_promoted_to_admin',
      params: { email },
      success: true
    })
  } catch (error) {
    console.error('Set admin error:', error)
    return NextResponse.json(
      { 
        error: 'set_admin_failed',
        details: error instanceof Error ? error.message : 'unknown_error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'set_admin_email_required_body' },
        { status: 400 }
      )
    }

    // 更新用户角色为管理员
    const result = await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.email, email))
      .returning()

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'user_not_found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      messageKey: 'user_promoted_to_admin',
      params: { email },
      success: true
    })
  } catch (error) {
    console.error('Set admin error:', error)
    return NextResponse.json(
      { 
        error: 'set_admin_failed',
        details: error instanceof Error ? error.message : 'unknown_error'
      },
      { status: 500 }
    )
  }
} 