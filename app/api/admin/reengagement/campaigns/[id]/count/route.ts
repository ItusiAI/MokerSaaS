import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reengagementCampaigns, users } from '@/lib/schema'
import { eq, and, isNotNull, count } from 'drizzle-orm'
import { isAdmin } from '@/lib/auth-utils'
import { getCampaignBucketConditions } from '@/lib/reengagement-buckets'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminAccess = await isAdmin()
  if (!adminAccess) return NextResponse.json({ error: 'admin_required' }, { status: 403 })

  const { id } = await params
  const [campaign] = await db
    .select()
    .from(reengagementCampaigns)
    .where(eq(reengagementCampaigns.id, id))
  if (!campaign) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const cond = getCampaignBucketConditions(campaign.bucket)
  if (!cond) return NextResponse.json({ error: 'invalid_bucket' }, { status: 400 })

  const [{ count: total }] = await db
    .select({ count: count() })
    .from(users)
    .where(and(cond, isNotNull(users.updatedAt)))

  return NextResponse.json({ bucket: campaign.bucket, count: Number(total) })
}
