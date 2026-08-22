import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  reengagementCampaigns,
  reengagementLogs,
  users,
} from '@/lib/schema'
import { eq, and, inArray, isNotNull } from 'drizzle-orm'
import { isAdmin } from '@/lib/auth-utils'
import { generateReengagementEmailHTML, sendEmail } from '@/lib/email'
import { getCampaignBucketConditions } from '@/lib/reengagement-buckets'

type EmailLocale = 'en' | 'zh-CN' | 'ja' | 'ko' | 'zh-TW'
const VALID_LOCALES: EmailLocale[] = ['en', 'zh-CN', 'ja', 'ko', 'zh-TW']

function safeLocale(locale: string | null | undefined): EmailLocale {
  return VALID_LOCALES.includes(locale as EmailLocale)
    ? (locale as EmailLocale)
    : 'en'
}

type CampaignContent = {
  subject: string
  heading: string
  body: string
  cta: string
  footer: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminAccess = await isAdmin()
  if (!adminAccess) {
    return NextResponse.json({ error: 'admin_required' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const targetUserIds: string[] | undefined = body.targetUserIds

  const [campaign] = await db
    .select()
    .from(reengagementCampaigns)
    .where(eq(reengagementCampaigns.id, id))

  if (!campaign) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  if (campaign.status === 'sending') {
    return NextResponse.json({ error: 'already_sending' }, { status: 400 })
  }
  if (campaign.status === 'completed') {
    return NextResponse.json({ error: 'already_completed' }, { status: 400 })
  }
  if (!campaign.content) {
    return NextResponse.json({ error: 'no_content' }, { status: 400 })
  }

  await db
    .update(reengagementCampaigns)
    .set({ status: 'sending', startedAt: new Date() })
    .where(eq(reengagementCampaigns.id, id))

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mokeraas.com'

  let targetUsers:
    | { id: string; email: string; name: string | null; preferredLanguage: string | null }[]
    | null = null
  let fatalError: string | null = null

  try {
    if (targetUserIds && targetUserIds.length > 0) {
      const deduped = [...new Set(targetUserIds)]
      targetUsers = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          preferredLanguage: users.preferredLanguage,
        })
        .from(users)
        .where(inArray(users.id, deduped))
    } else {
      const bucketConditions = getCampaignBucketConditions(campaign.bucket)
      if (!bucketConditions) {
        fatalError = 'invalid_bucket'
      } else {
        targetUsers = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            preferredLanguage: users.preferredLanguage,
          })
          .from(users)
          .where(and(bucketConditions, isNotNull(users.updatedAt)))
      }
    }

    if (targetUsers === null) {
      // 上面 fatalError 已设置,下面 finally 会把状态写回 cancelled
      throw new Error(fatalError || 'no_target_users')
    }

    console.log(
      '[reengagement send] targetUsers count:',
      targetUsers.length,
      'campaign:',
      id,
      'bucket:',
      campaign.bucket,
    )

    const { nanoid } = await import('nanoid')

    let sentCount = 0
    let failedCount = 0

    const BATCH_SIZE = 50
    const BATCH_DELAY = 500

    // 兼容:jsonb 字段直接返回对象;如果还是 text(Drizzle 没自动解析),手动 JSON.parse
    let rawContentField = campaign.content as any
    if (typeof rawContentField === 'string') {
      try {
        rawContentField = JSON.parse(rawContentField)
      } catch (e) {
        console.error('[reengagement send] JSON parse error:', e)
      }
    }

    // 兼容旧数据可能是数组的情况
    const contentObj: Record<string, any> = (() => {
      if (Array.isArray(rawContentField)) {
        const result: Record<string, any> = {}
        for (const item of rawContentField) {
          if (item?.locale) {
            result[item.locale] = item
          }
        }
        return result
      }
      return rawContentField || {}
    })()

    console.log(
      '[reengagement send] contentObj keys:',
      Object.keys(contentObj),
    )

    for (let i = 0; i < targetUsers.length; i += BATCH_SIZE) {
      const batch = targetUsers.slice(i, i + BATCH_SIZE)
      console.log(
        '[reengagement send] processing batch:',
        batch.map((u) => u.email).join(', '),
      )

      await Promise.all(
        batch.map(async (user) => {
          try {
            const userLocale = safeLocale(user.preferredLanguage)
            const rawContent: CampaignContent | undefined =
              contentObj?.[userLocale] || contentObj?.['en']

            if (!rawContent) {
              console.log(
                '[reengagement send] SKIP: no content for user',
                user.email,
              )
              return
            }

            const unsubscribeToken = user.id
            const ctaUrl = `${baseUrl}/${userLocale}`
            const unsubscribeUrl = `${baseUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}`

            const bodyParts = (rawContent.body || '').split('\n\n')
            const footerParts = (rawContent.footer || '').split('\n')

            const copy = {
              subject: rawContent.subject,
              preview: '',
              heading: rawContent.heading,
              greeting: (name: string) => `Hi ${name},`,
              body1: bodyParts[0] || '',
              body2: bodyParts[1] || '',
              cta: rawContent.cta,
              footer1: footerParts[0] || '',
              footer2: footerParts[1] || '',
              footer3: '',
            }

            console.log(
              '[reengagement send] preparing email for:',
              user.email,
            )

            const html = generateReengagementEmailHTML(
              copy,
              user.name || 'User',
              ctaUrl,
              unsubscribeUrl,
            )
            const result = await sendEmail({
              to: user.email,
              subject: rawContent.subject,
              html,
              headers: {
                'List-Unsubscribe': `<${unsubscribeUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              },
            })

            console.log(
              '[reengagement send] email result:',
              user.email,
              result.success ? 'SUCCESS' : 'FAILED',
              result.messageId || result.error,
            )

            const logId = nanoid()
            console.log(
              '[reengagement send] inserting log:',
              logId,
              'for user:',
              user.email,
            )
            await db.insert(reengagementLogs).values({
              id: logId,
              campaignId: id,
              userId: user.id,
              email: user.email,
              subject: rawContent.subject,
              locale: userLocale,
              bucket: campaign.bucket,
              status: result.success ? 'sent' : 'failed',
              messageId: result.messageId ?? null,
              errorMessage: result.error ?? null,
              sentAt: result.success ? new Date() : null,
            })
            console.log('[reengagement send] log inserted:', logId)

            if (result.success) sentCount++
            else failedCount++
          } catch (err) {
            console.error('[reengagement send] error:', user.email, err)
          }
        }),
      )

      if (i + BATCH_SIZE < targetUsers.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY))
      }
    }

    await db
      .update(reengagementCampaigns)
      .set({
        status: 'completed',
        targetCount: targetUsers.length,
        sentCount,
        failedCount,
        completedAt: new Date(),
      })
      .where(eq(reengagementCampaigns.id, id))

    return NextResponse.json({
      success: true,
      summary: {
        targetCount: targetUsers.length,
        sentCount,
        failedCount,
      },
    })
  } catch (err) {
    // 任何意料之外的异常 → 把状态写回 cancelled,避免永久卡在 sending
    fatalError = fatalError || (err instanceof Error ? err.message : 'send_failed')
    throw err
  } finally {
    if (fatalError) {
      // bucket 无效 / 查不到目标用户 这类前置错误 → 直接 cancelled
      // 其它 send 循环中的异常已在 batch.map 内 log,正常流不进入此分支
      const stillSending = await db
        .select({ status: reengagementCampaigns.status })
        .from(reengagementCampaigns)
        .where(eq(reengagementCampaigns.id, id))

      if (stillSending[0]?.status === 'sending') {
        await db
          .update(reengagementCampaigns)
          .set({ status: 'cancelled', completedAt: new Date() })
          .where(eq(reengagementCampaigns.id, id))
      }
    }
  }
}
