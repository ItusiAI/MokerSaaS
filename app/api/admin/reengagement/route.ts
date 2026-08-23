import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { sql, desc, asc, or, and, eq, ne, count, isNotNull, isNull, gt } from 'drizzle-orm'
import { isAdmin } from '@/lib/auth-utils'
import { inactiveDaysExpr, hasActiveSubscriptionExpr } from '@/lib/reengagement-buckets'

// 转义 LIKE 模式中的特殊字符,防止 "%" / "_" 触发通配符匹配
function escapeLikePattern(input: string): string {
  return input.replace(/[\\%_]/g, (ch) => `\\${ch}`)
}

// 沉睡用户分桶阈值(天数)
const BUCKET_THRESHOLDS = {
  active: 7,
  warm: 31,         // [7, 31)   = 业务上的 [7, 30]
  dormant: 91,      // [31, 91)  = 业务上的 [31, 90]
  inactive: 181,    // [91, 181) = 业务上的 [91, 180]
  churned: Number.MAX_SAFE_INTEGER,
} as const

type DormantBucket = 'active' | 'warm' | 'dormant' | 'inactive' | 'churned'

function bucketFor(inactiveDays: number): DormantBucket {
  if (inactiveDays < BUCKET_THRESHOLDS.active) return 'active'
  if (inactiveDays < BUCKET_THRESHOLDS.warm) return 'warm'
  if (inactiveDays < BUCKET_THRESHOLDS.dormant) return 'dormant'
  if (inactiveDays < BUCKET_THRESHOLDS.inactive) return 'inactive'
  return 'churned'
}

export interface DormantUserRow {
  id: string
  email: string
  name: string | null
  preferredLanguage: string | null
  role: string | null
  points: number | null
  subscriptionStatus: string | null
  subscriptionPlan: string | null
  subscriptionCurrentPeriodEnd: string | null
  updatedAt: string | null
  createdAt: string | null
  inactiveDays: number
  bucket: DormantBucket
  emailVerified: boolean
}

interface DormantListResponse {
  rows: DormantUserRow[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  mode: 'dormant' | 'inactive_signups'
  stats: {
    totalUsers: number          // 全量用户
    inactiveSignups: number     // 未激活账号(updatedAt IS NULL 且 emailVerified IS NULL)
                                 // 注:旧版本此处为有效订阅用户数
    // 下面 5 个分桶,均 **不包含未激活账号和有效订阅用户**
    active: number
    warm: number
    dormant: number
    inactive: number
    churned: number
    dormantTotal: number        // warm + dormant + inactive + churned
    dormantPaidHistory: number  // 沉睡用户中曾经有过付费的用户(cancelled/expired/past_due 等)
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
  const rawSearch = (searchParams.get('search') || '').trim()
  const search = rawSearch ? escapeLikePattern(rawSearch) : ''
  const bucket = (searchParams.get('bucket') || '').trim()
  const locale = (searchParams.get('locale') || '').trim()
  const subscriptionFilter = (searchParams.get('subscription') || '').trim()
  const sort = (searchParams.get('sort') || 'inactive_desc')
  const mode = (searchParams.get('mode') || '').trim() // 'inactive_signups' 列出未激活账号(updatedAt 为空)

  // 沉睡天数表达式:已在 lib/reengagement-buckets 中定义,此处复用

  // ========== 默认 WHERE ==========
  // - mode='inactive_signups': 列出"未激活账号"(updatedAt 为空 且 邮箱未验证)。
  //   这种账号不能发召回邮件,所以也不属于任何沉睡分桶;在此 mode 下
  //   baseWhere 改成 `updatedAt IS NULL AND emailVerified IS NULL`,
  //   与下方 bucketStatsRows 口径互斥(那里排除这两种状态)。
  // - 其他情况: 排除有效订阅用户(他们是活跃付费用户)
  // 同时排除邮箱已验证但 updatedAt 为空的用户? 不,未激活账号一定未验证;
  // 以下 baseWhere 仅用于非 inactive_signups 模式,所以加 emailVerified IS NOT NULL
  // 安全(已与 bucketStatsRows 保持一致,避免 stats 卡片数字大于实际可发送目标)。
  const baseWhere: any[] = []
  if (mode === 'inactive_signups') {
    baseWhere.push(
      sql`${users.updatedAt} IS NULL`,
      sql`${users.emailVerified} IS NULL`
    )
  } else {
    baseWhere.push(
      isNotNull(users.updatedAt),
      sql`${users.emailVerified} IS NOT NULL`,
      sql`NOT (${hasActiveSubscriptionExpr})`
    )
  }

  // 分桶 WHERE 条件
  const bucketWhere: any[] = []
  const validBuckets: DormantBucket[] = ['active', 'warm', 'dormant', 'inactive', 'churned']
  if (bucket && validBuckets.includes(bucket as DormantBucket)) {
    const b = bucket as DormantBucket
    if (b === 'active') {
      bucketWhere.push(sql`${inactiveDaysExpr} < ${BUCKET_THRESHOLDS.active}`)
    } else if (b === 'warm') {
      bucketWhere.push(
        sql`${inactiveDaysExpr} >= ${BUCKET_THRESHOLDS.active} AND ${inactiveDaysExpr} < ${BUCKET_THRESHOLDS.warm}`
      )
    } else if (b === 'dormant') {
      bucketWhere.push(
        sql`${inactiveDaysExpr} >= ${BUCKET_THRESHOLDS.warm} AND ${inactiveDaysExpr} < ${BUCKET_THRESHOLDS.dormant}`
      )
    } else if (b === 'inactive') {
      bucketWhere.push(
        sql`${inactiveDaysExpr} >= ${BUCKET_THRESHOLDS.dormant} AND ${inactiveDaysExpr} < ${BUCKET_THRESHOLDS.inactive}`
      )
    } else if (b === 'churned') {
      bucketWhere.push(sql`${inactiveDaysExpr} >= ${BUCKET_THRESHOLDS.inactive}`)
    }
  } else if (!bucket && mode !== 'inactive_signups') {
    // 默认只看沉睡用户(>= 7 天),活跃用户量太大通常没意义
    // inactive_signups 模式下不强制,因为未激活账号 updatedAt 为空,无法计算天数
    bucketWhere.push(sql`${inactiveDaysExpr} >= ${BUCKET_THRESHOLDS.active}`)
  }

  // 搜索
  const searchWhere: any[] = []
  if (rawSearch) {
    searchWhere.push(
      or(
        sql`${users.email} LIKE ${`%${search}%`} ESCAPE '\\'`,
        sql`${users.name} LIKE ${`%${search}%`} ESCAPE '\\'`,
      )
    )
  }

  // 语言
  const localeWhere: any[] = []
  if (locale && ['en', 'zh-CN', 'ja', 'ko', 'zh-TW'].includes(locale)) {
    localeWhere.push(eq(users.preferredLanguage, locale))
  }

  // 订阅状态筛选
  // "active" 和 "paid_history" 语义相同(baseWhere 已排除有效订阅),
  // 这里都对应"曾订阅但当前非有效(已过期/cancelled/past_due)"的用户
  const subWhere: any[] = []
  if (subscriptionFilter === 'active' || subscriptionFilter === 'paid_history') {
    subWhere.push(isNotNull(users.subscriptionStatus))
  } else if (subscriptionFilter === 'never_paid') {
    subWhere.push(isNull(users.subscriptionStatus))
  }

  const whereExpr = and(
    ...baseWhere,
    ...bucketWhere,
    ...searchWhere,
    ...localeWhere,
    ...subWhere
  )

  // 排序
  let orderBy: any
  if (sort === 'inactive_asc') {
    orderBy = asc(inactiveDaysExpr)
  } else if (sort === 'points_desc') {
    orderBy = desc(users.points)
  } else if (sort === 'created_desc') {
    orderBy = desc(users.createdAt)
  } else {
    orderBy = desc(inactiveDaysExpr)
  }

  // 总数(同一筛选条件)
  const totalRow = await db
    .select({ total: count() })
    .from(users)
    .where(whereExpr)

  // 列表数据
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      preferredLanguage: users.preferredLanguage,
      role: users.role,
      points: users.points,
      subscriptionStatus: users.subscriptionStatus,
      subscriptionPlan: users.subscriptionPlan,
      subscriptionCurrentPeriodEnd: users.subscriptionCurrentPeriodEnd,
      updatedAt: users.updatedAt,
      createdAt: users.createdAt,
      emailVerified: users.emailVerified,
      inactiveDays: inactiveDaysExpr,
    })
    .from(users)
    .where(whereExpr)
    .orderBy(orderBy)
    .limit(limit)
    .offset((page - 1) * limit)

  // 在 Node 端补充分桶/日期格式化
  const enrichedRows: DormantUserRow[] = rows.map((r) => ({
    ...r,
    bucket: bucketFor(r.inactiveDays ?? 0),
    subscriptionCurrentPeriodEnd: r.subscriptionCurrentPeriodEnd
      ? r.subscriptionCurrentPeriodEnd.toISOString()
      : null,
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    emailVerified: !!r.emailVerified,
  }))

  // ===== 全局统计(不受当前筛选影响)=====

  // 全量用户数
  const totalUsersRow = await db.select({ total: count() }).from(users)

  // 未激活账号:邮箱未验证、注册后从未活跃过(updatedAt IS NULL)的用户。
  // 这类账号有两种典型来源:
  //   1. 注册时输入错误邮箱(拼写、占位邮箱等),永远不会收到验证邮件;
  //   2. OAuth 一键登录后未做任何操作就走开了。
  // 它们既不能发召回邮件(损害送达率),也未真正成为产品用户,
  // 不属于任何沉睡分桶,单独在此卡片聚合,让顶部 7 个数字之和 = 总用户数。
  // 与下方 bucketStats / baseWhere 口径互斥:bucketStats 排除 `updatedAt IS NULL`
  // 和 `emailVerified IS NULL`,inactiveSignups 只挑这两类账号。
  const inactiveSignupsRow = await db
    .select({ total: count() })
    .from(users)
    .where(
      and(
        sql`${users.updatedAt} IS NULL`,
        sql`${users.emailVerified} IS NULL`
      )
    )

  // 按分桶统计 - **只统计非有效订阅用户**
  // 与 baseWhere / dormantPaidHistoryRow 保持一致:排除 updatedAt 为空
  // 和邮箱未验证的用户,避免 stats 卡片数字大于实际可发送目标
  const bucketStatsRows = await db
    .select({
      bucket: sql<DormantBucket>`
        CASE
          WHEN ${inactiveDaysExpr} < ${BUCKET_THRESHOLDS.active} THEN 'active'
          WHEN ${inactiveDaysExpr} < ${BUCKET_THRESHOLDS.warm} THEN 'warm'
          WHEN ${inactiveDaysExpr} < ${BUCKET_THRESHOLDS.dormant} THEN 'dormant'
          WHEN ${inactiveDaysExpr} < ${BUCKET_THRESHOLDS.inactive} THEN 'inactive'
          ELSE 'churned'
        END
      `,
      total: count(),
    })
    .from(users)
    .where(
      and(
        isNotNull(users.updatedAt),
        sql`NOT (${hasActiveSubscriptionExpr})`,
        sql`${users.emailVerified} IS NOT NULL`
      )
    )
    .groupBy(sql`1`)

  // 沉睡 + 曾经付费的用户数(cancelled/expired/past_due 等)
  // 这是高价值挽回对象:他们用过付费功能、知道产品价值,只是没续费
  // 排除邮箱未验证用户,与 campaign 发送目标保持一致
  const dormantPaidHistoryRow = await db
    .select({ total: count() })
    .from(users)
    .where(
      and(
        isNotNull(users.updatedAt),
        sql`NOT (${hasActiveSubscriptionExpr})`,
        isNotNull(users.subscriptionStatus),
        gt(inactiveDaysExpr, BUCKET_THRESHOLDS.active),
        sql`${users.emailVerified} IS NOT NULL`
      )
    )

  const stats = {
    totalUsers: totalUsersRow[0]?.total ?? 0,
    inactiveSignups: inactiveSignupsRow[0]?.total ?? 0,
    active: 0,
    warm: 0,
    dormant: 0,
    inactive: 0,
    churned: 0,
    dormantTotal: 0,
    dormantPaidHistory: dormantPaidHistoryRow[0]?.total ?? 0,
  }
  for (const r of bucketStatsRows) {
    stats[r.bucket] = r.total
    if (r.bucket !== 'active') {
      stats.dormantTotal += r.total
    }
  }

  const response: DormantListResponse = {
    rows: enrichedRows,
    pagination: {
      page,
      limit,
      total: totalRow[0]?.total ?? 0,
      totalPages: Math.max(1, Math.ceil((totalRow[0]?.total ?? 0) / limit)),
    },
    mode: mode === 'inactive_signups' ? 'inactive_signups' : 'dormant',
    stats,
  }

  return NextResponse.json(response)
}