import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reengagementCampaigns } from '@/lib/schema'
import { desc, count, eq } from 'drizzle-orm'
import { isAdmin } from '@/lib/auth-utils'
import { nanoid } from 'nanoid'
import { reengagementCopy, type ReengagementBucket, type ReengagementCopy } from '@/lib/email'

type EmailLocale = 'en' | 'zh' | 'ja' | 'ko' | 'tw'
const VALID_LOCALES: EmailLocale[] = ['en', 'zh', 'ja', 'ko', 'tw']

function toSerializableCopy(copy: ReengagementCopy): Record<string, string> {
  return {
    subject: copy.subject,
    heading: copy.heading,
    body: copy.body1 + (copy.body2 ? '\n\n' + copy.body2 : ''),
    cta: copy.cta,
    footer: copy.footer1 + '\n' + copy.footer2,
  }
}

export async function GET(request: NextRequest) {
  const adminAccess = await isAdmin()
  if (!adminAccess) {
    return NextResponse.json({ error: 'admin_required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const status = (searchParams.get('status') || '').trim()
  const bucket = (searchParams.get('bucket') || '').trim()

  const offset = (page - 1) * limit

  type WhereClause = any
  const conditions: WhereClause[] = []
  if (status) conditions.push(eq(reengagementCampaigns.status, status))
  if (bucket) conditions.push(eq(reengagementCampaigns.bucket, bucket))

  const where = conditions.length > 0 ? conditions : undefined

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(reengagementCampaigns)
      .where(where ? where as any : undefined)
      .orderBy(desc(reengagementCampaigns.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(reengagementCampaigns)
      .where(where ? where as any : undefined),
  ])

  const totalPages = Math.ceil(Number(total) / limit)

  return NextResponse.json({
    campaigns: rows,
    pagination: { page, limit, total: Number(total), totalPages },
  })
}

export async function POST(request: NextRequest) {
  const adminAccess = await isAdmin()
  if (!adminAccess) {
    return NextResponse.json({ error: 'admin_required' }, { status: 403 })
  }

  const body = await request.json()
  const { name, bucket, scheduledAt } = body

  if (!name || !bucket) {
    return NextResponse.json({ error: 'missing_required_fields' }, { status: 400 })
  }

  const VALID_BUCKETS = ['warm', 'dormant', 'inactive', 'churned', 'sleeping_paid']
  if (!VALID_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: 'invalid_bucket' }, { status: 400 })
  }

  // 始终使用默认模板填充 5 种语言
  const bucketCopy = reengagementCopy[bucket as ReengagementBucket]
  const finalContent: Record<EmailLocale, Record<string, string>> = {
    en: toSerializableCopy(bucketCopy.en),
    zh: toSerializableCopy(bucketCopy.zh),
    ja: toSerializableCopy(bucketCopy.ja),
    ko: toSerializableCopy(bucketCopy.ko),
    tw: toSerializableCopy(bucketCopy.tw),
  }

  const id = nanoid()
  const status = scheduledAt ? 'ready' : 'draft'

  const [campaign] = await db
    .insert(reengagementCampaigns)
    .values({
      id,
      name,
      bucket,
      content: finalContent as any,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status,
    })
    .returning()

  return NextResponse.json({ campaign }, { status: 201 })
}
