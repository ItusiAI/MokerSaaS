import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reengagementLogs, reengagementCampaigns } from '@/lib/schema'
import { desc, count, eq, sql, type SQL } from 'drizzle-orm'
import { isAdmin } from '@/lib/auth-utils'

// 转义 LIKE 模式中的特殊字符(\, %, _),防止 "%" / "_" 触发通配符匹配。
// 注意:必须配合 ESCAPE '\\' 使用,否则反斜杠自身仍是普通字符。
function escapeLikePattern(input: string): string {
  return input.replace(/[\\%_]/g, (ch) => `\\${ch}`)
}

export async function GET(request: NextRequest) {
  const adminAccess = await isAdmin()
  if (!adminAccess) {
    return NextResponse.json({ error: 'admin_required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const rawSearch = (searchParams.get('search') || '').trim()
  const status = (searchParams.get('status') || '').trim()
  const campaignId = (searchParams.get('campaignId') || '').trim()
  const bucket = (searchParams.get('bucket') || '').trim()
  const search = escapeLikePattern(rawSearch)

  const offset = (page - 1) * limit

  const conditions: any[] = []
  if (campaignId) conditions.push(eq(reengagementLogs.campaignId, campaignId))
  if (status) conditions.push(eq(reengagementLogs.status, status))
  if (bucket) conditions.push(eq(reengagementLogs.bucket, bucket))
  if (rawSearch) {
    conditions.push(
      sql`${reengagementLogs.email} LIKE ${`%${search}%`} ESCAPE '\\'`,
    )
  }

  const where = conditions.length > 0 ? conditions : (undefined as unknown as SQL[])

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: reengagementLogs.id,
        campaignId: reengagementLogs.campaignId,
        userId: reengagementLogs.userId,
        email: reengagementLogs.email,
        subject: reengagementLogs.subject,
        locale: reengagementLogs.locale,
        bucket: reengagementLogs.bucket,
        status: reengagementLogs.status,
        messageId: reengagementLogs.messageId,
        errorMessage: reengagementLogs.errorMessage,
        sentAt: reengagementLogs.sentAt,
        createdAt: reengagementLogs.createdAt,
        campaignName: reengagementCampaigns.name,
      })
      .from(reengagementLogs)
      .leftJoin(
        reengagementCampaigns,
        eq(reengagementLogs.campaignId, reengagementCampaigns.id),
      )
      .where(where as any)
      .orderBy(desc(reengagementLogs.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(reengagementLogs)
      .where(where as any),
  ])

  const totalPages = Math.ceil(Number(total) / limit)

  return NextResponse.json({
    logs: rows,
    pagination: { page, limit, total: Number(total), totalPages },
  })
}
