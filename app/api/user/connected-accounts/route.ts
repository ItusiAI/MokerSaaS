import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      )
    }

    // 获取用户的关联账户信息
    const accounts = await db.query.accounts.findMany({
      where: (accounts, { eq }) => eq(accounts.userId, session.user.id),
    })

    const connectedAccounts = [
      {
        provider: 'github',
        connected: accounts.some(acc => acc.provider === 'github'),
      },
      {
        provider: 'google',
        connected: accounts.some(acc => acc.provider === 'google'),
      },
    ]

    return NextResponse.json({
      success: true,
      accounts: connectedAccounts,
    })
  } catch (error) {
    console.error('获取关联账户失败:', error)
    return NextResponse.json(
      { error: 'server_error' },
      { status: 500 }
    )
  }
} 