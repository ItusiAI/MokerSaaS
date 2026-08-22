import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reengagementCampaigns } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { isAdmin } from '@/lib/auth-utils'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminAccess = await isAdmin()
  if (!adminAccess) {
    return NextResponse.json({ error: 'admin_required' }, { status: 403 })
  }

  const { id } = await params
  const [campaign] = await db
    .select()
    .from(reengagementCampaigns)
    .where(eq(reengagementCampaigns.id, id))

  if (!campaign) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  if (campaign.status === 'sending') {
    return NextResponse.json({ error: 'cannot_delete_sending' }, { status: 400 })
  }

  await db.delete(reengagementCampaigns).where(eq(reengagementCampaigns.id, id))

  return NextResponse.json({ success: true })
}
