import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { sql, desc, asc, like, or, and, eq, ne, count, isNotNull, isNull, gt } from 'drizzle-orm'
import { isAdmin } from '@/lib/auth-utils'

// 沉睡用户分桶阈值(天数)
const BUCKET_THRESHOLDS = {
  active: 7,        // < 7 天 -> 活跃
  warm: 30,         // 7 - 30 天 -> 早期沉睡
  dormant: 90,      // 30 - 90 天 -> 中度沉睡
  inactive: 180,    // 90 - 180 天 -> 重度沉睡
  // >= 180 天 -> 流失
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
  mode: 'dormant' | 'active_subscribers'
  stats: {
    totalUsers: number          // 全量用户
    activeSubscribers: number   // 有效订阅用户(沉不沉睡都不算)
    // 下面 5 个分桶,均 **不包含有效订阅用户**
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
  const search = (searchParams.get('search') || '').trim()
  const bucket = (searchParams.get('bucket') || '').trim()
  const locale = (searchParams.get('locale') || '').trim()
  const subscriptionFilter = (searchParams.get('subscription') || '').trim()
  const sort = (searchParams.get('sort') || 'inactive_desc')
  const mode = (searchParams.get('mode') || '').trim() // 'active_subscribers' 列出有效订阅用户

  // 沉睡天数表达式:使用 updatedAt (用户最近活跃) 作为基准,NULL 时 fallback 到 createdAt
  const inactiveDaysExpr = sql<number>`EXTRACT(DAY FROM (NOW() - COALESCE(${users.updatedAt}, ${users.createdAt}, NOW())))::int`

  // "有效订阅"判定:status = 'active' AND periodEnd > now
  // 与 lib/subscription.ts hasActiveSubscription 保持一致
  const hasActiveSubscriptionExpr = sql<boolean>`
    ${users.subscriptionStatus} = 'active'
    AND ${users.subscriptionCurrentPeriodEnd} IS NOT NULL
    AND ${users.subscriptionCurrentPeriodEnd} > NOW()
  `

  // ========== 默认 WHERE ==========
  // - mode='active_subscribers': 只看有效订阅用户(不受沉睡天数限制)
  // - 其他情况: 排除有效订阅用户(他们是活跃付费用户)
  const baseWhere: any[] = [isNotNull(users.updatedAt)]
  if (mode === 'active_subscribers') {
    baseWhere.push(sql`${hasActiveSubscriptionExpr}`)
  } else {
    baseWhere.push(sql`NOT (${hasActiveSubscriptionExpr})`)
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
  } else if (!bucket && mode !== 'active_subscribers') {
    // 默认只看沉睡用户(>= 7 天),活跃用户量太大通常没意义
    // active_subscribers 模式下不强制,因为有效订阅用户即使活跃也要展示
    bucketWhere.push(sql`${inactiveDaysExpr} >= ${BUCKET_THRESHOLDS.active}`)
  }

  // 搜索
  const searchWhere: any[] = []
  if (search) {
    searchWhere.push(
      or(like(users.email, `%${search}%`), like(users.name, `%${search}%`))
    )
  }

  // 语言
  const localeWhere: any[] = []
  if (locale && ['en', 'zh', 'ja', 'ko', 'tw'].includes(locale)) {
    localeWhere.push(eq(users.preferredLanguage, locale))
  }

  // 订阅状态筛选
  // 注意: 这里的 "active" 因为 baseWhere 已排除有效订阅,等同于"曾经订阅但已过期"
  const subWhere: any[] = []
  if (subscriptionFilter === 'active') {
    // 已订阅但当前非有效(已过期/cancelled/past_due) - 高价值流失用户
    subWhere.push(isNotNull(users.subscriptionStatus))
  } else if (subscriptionFilter === 'paid_history') {
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

  // 有效订阅用户数(沉不沉睡都不算沉睡)
  const activeSubscribersRow = await db
    .select({ total: count() })
    .from(users)
    .where(sql`${hasActiveSubscriptionExpr}`)

  // 按分桶统计 - **只统计非有效订阅用户**
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
        sql`NOT (${hasActiveSubscriptionExpr})`
      )
    )
    .groupBy(sql`1`)

  // 沉睡 + 曾经付费的用户数(cancelled/expired/past_due 等)
  // 这是高价值挽回对象:他们用过付费功能、知道产品价值,只是没续费
  const dormantPaidHistoryRow = await db
    .select({ total: count() })
    .from(users)
    .where(
      and(
        isNotNull(users.updatedAt),
        sql`NOT (${hasActiveSubscriptionExpr})`,
        isNotNull(users.subscriptionStatus),
        gt(inactiveDaysExpr, BUCKET_THRESHOLDS.active)
      )
    )

  const stats = {
    totalUsers: totalUsersRow[0]?.total ?? 0,
    activeSubscribers: activeSubscribersRow[0]?.total ?? 0,
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
    mode: mode === 'active_subscribers' ? 'active_subscribers' : 'dormant',
    stats,
  }

  return NextResponse.json(response)
}