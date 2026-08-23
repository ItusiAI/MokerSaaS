import { sql } from 'drizzle-orm'
import { users } from './schema'

// 沉睡用户分桶阈值(单位:天)。
//
// **业务边界**(用户视角):
//   active   : < 7                         活跃
//   warm     : [7, 30]                     早期沉睡
//   dormant  : [31, 90]                    中度沉睡
//   inactive : [91, 180]                   重度沉睡
//   churned  : >= 181                      流失
//
// 实现上用 SQL **半开区间 `[lower, upper)`**。例如 warm 桶的 SQL 条件是
// `days >= 7 AND days < 31`,等价于业务上的 `days in [7, 30]`。
//
// 为了在 stats 卡片(用 `< upper` 单边比较)和 campaign 召回(用 `>= lower AND < upper`)
// 两处都能复用同一个上界,这里把每个桶的 **上界(排他)** 提到常量上:
// 上界 = 业务边界 + 1,只有 `active` 是单边(`< 7`)。
//
// 下界 = 上一桶的上界(派生),无需单独维护。
export const BUCKET_THRESHOLDS = {
  active: 7,                // active 桶是单边:days < 7
  warm: 31,                 // [7, 31)   = 业务上的 [7, 30]
  dormant: 91,              // [31, 91)  = 业务上的 [31, 90]
  inactive: 181,            // [91, 181) = 业务上的 [91, 180]
  churned: Number.MAX_SAFE_INTEGER,
} as const

// 通用 [下限, 上限) 对照表,`upper` 等于 BUCKET_THRESHOLDS[bucket]。
// 调用方拿到 (lower, upper) 后拼成 SQL 半开区间。
const BUCKET_NEXT = {
  warm: BUCKET_THRESHOLDS.dormant,
  dormant: BUCKET_THRESHOLDS.inactive,
  inactive: BUCKET_THRESHOLDS.churned,
  churned: BUCKET_THRESHOLDS.churned,
} as const

// 每个桶的 SQL 下界 = 业务边界左侧(闭)。
// active 桶没有显式下界,业务上等价于 days >= 0,所以这里记 0。
// 注:warm/dormant/inactive/churned 的下界都对应"上一桶的上界",
// 即业务边界 +1,与 BUCKET_NEXT 中的上一桶 upper 一致。
const BUCKET_LOWER = {
  active: 0,
  warm: BUCKET_THRESHOLDS.active,        // 7
  dormant: BUCKET_THRESHOLDS.warm,       // 31
  inactive: BUCKET_THRESHOLDS.dormant,   // 91
  churned: BUCKET_THRESHOLDS.inactive,  // 181
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
      EXTRACT(DAY FROM (NOW() - COALESCE(${users.updatedAt}, ${users.createdAt})))::int >= ${BUCKET_THRESHOLDS.active}
      AND ${users.subscriptionStatus} IS NOT NULL
      AND NOT (${hasActiveSubscriptionExpr})
      AND ${users.emailVerified} IS NOT NULL
    `
  }

  if (!CAMPAIGN_BUCKETS.includes(bucket as ReengagementCampaignBucket)) {
    return null
  }

  const bucketKey = bucket as Exclude<ReengagementCampaignBucket, 'sleeping_paid'>
  const lower = BUCKET_LOWER[bucketKey]
  const upper = BUCKET_NEXT[bucketKey]

  return sql`
    EXTRACT(DAY FROM (NOW() - COALESCE(${users.updatedAt}, ${users.createdAt})))::int >= ${lower}
    AND EXTRACT(DAY FROM (NOW() - COALESCE(${users.updatedAt}, ${users.createdAt})))::int < ${upper}
    AND NOT (${hasActiveSubscriptionExpr})
    AND ${users.emailVerified} IS NOT NULL
  `
}
