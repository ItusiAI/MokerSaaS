import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { expireSubscriptionIfNeeded } from '@/lib/subscription'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return null
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1)

  const user = result[0]
  if (!user) return null

  // 入口拦截:每次请求检查订阅是否过期(带 10s 缓存,避免重复查询)
  await expireSubscriptionIfNeeded(user.id)

  // 重新读取 fresh 状态(因为可能刚清零)
  const fresh = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  return fresh[0] ?? null
}

export async function isAdmin() {
  const user = await getCurrentUser()
  return user?.role === 'admin'
}

export async function requireAdmin(locale?: string) {
  const admin = await isAdmin()
  if (!admin) {
    const safeLocale = locale && ['en', 'zh-CN', 'ja', 'ko', 'zh-TW'].includes(locale) ? locale : 'zh-CN'
    redirect(`/${safeLocale}/unauthorized`)
  }
  return true
} 