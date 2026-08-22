import { sql } from 'drizzle-orm'
import { users } from './schema'

// 沉睡用户分桶阈值(天数): < active=活跃, warm=7..30, dormant=30..90,
// inactive=90..180, churned>=180
export const BUCKET_THRESHOLDS = {
  active: 7,
  warm: 30,
  dormant: 90,
  inactive: 180,
  churned: Number.MAX_SAFE_INTEGER,
} as const

// 通用 [下限, 上限) 对照表
const BUCKET_NEXT = {
  warm: BUCKET_THRESHOLDS.dormant,
  dormant: BUCKET_THRESHOLDS.inactive,
  inactive: BUCKET_THRESHOLDS.churned,
  churned: BUCKET_THRESHOLDS.churned,
} as const

export type ReengagementCampaignBucket =
  | 'warm'
  | 'dormant'
  | 'inactive'
  | 'churned'
  | 'sleeping_paid'

export const CAMPAIGN_BUCKETS: ReengagementCampaignBucket[] = [
  'warm',
  'dormant',
  'inactive',
  'churned',
  'sleeping_paid',
]

// 用户最近活跃天数(integer days): updatedAt 优先,NULL 时 fallback 到 createdAt
export const inactiveDaysExpr = sql<number>`EXTRACT(DAY FROM (NOW() - COALESCE(${users.updatedAt}, ${users.createdAt}, NOW())))::int`

// 是否为有效订阅用户
export const hasActiveSubscriptionExpr = sql<boolean>`
  ${users.subscriptionStatus} = 'active'
  AND ${users.subscriptionCurrentPeriodEnd} IS NOT NULL
  AND ${users.subscriptionCurrentPeriodEnd} > NOW()
`

/**
 * 返回指定 campaign bucket 对应的 WHERE 条件 SQL 片段。
 * 不符合的 bucket(空字符串、未知值)返回 null。
 * 必须再与 `isNotNull(users.updatedAt)` 组合,排除 updatedAt 为空的僵尸账号。
 *
 * 注意:本函数会自动排除邮箱未验证(emailVerified IS NULL)的用户。
 * 召回邮件不能发给未验证邮箱,否则会污染送达率、触发 ISP 反垃圾规则。
 */
export function getCampaignBucketConditions(
  bucket: string | null | undefined,
): ReturnType<typeof sql> | null {
  if (!bucket) return null

  if (bucket === 'sleeping_paid') {
    return sql`
      EXTRACT(DAY FROM (NOW() - COALESCE(${users.updatedAt}, ${users.createdAt})))::int > ${BUCKET_THRESHOLDS.active}
      AND ${users.subscriptionStatus} IS NOT NULL
      AND NOT (${hasActiveSubscriptionExpr})
      AND ${users.emailVerified} IS NOT NULL
    `
  }

  if (!CAMPAIGN_BUCKETS.includes(bucket as ReengagementCampaignBucket)) {
    return null
  }

  const lower = BUCKET_THRESHOLDS[bucket as keyof typeof BUCKET_THRESHOLDS]
  if (lower === undefined) return null

  const upper =
    BUCKET_NEXT[bucket as keyof typeof BUCKET_NEXT] ??
    Number.MAX_SAFE_INTEGER

  return sql`
    EXTRACT(DAY FROM (NOW() - COALESCE(${users.updatedAt}, ${users.createdAt})))::int >= ${lower}
    AND EXTRACT(DAY FROM (NOW() - COALESCE(${users.updatedAt}, ${users.createdAt})))::int < ${upper}
    AND NOT (${hasActiveSubscriptionExpr})
    AND ${users.emailVerified} IS NOT NULL
  `
}
