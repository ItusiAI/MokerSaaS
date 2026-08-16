import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  users,
  pointsHistory,
  stripePayments,
  referrals,
  referralHistory,
  affiliateProfiles,
  affiliateRelations,
  affiliateEarnings,
  affiliateWithdrawals,
  newsletterSubscriptions,
} from '@/lib/schema'
import {
  eq,
  count,
  sum,
  sql,
  and,
  isNotNull,
  gte,
  lte,
  desc,
} from 'drizzle-orm'
import { isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminAccess = await isAdmin()
    if (!adminAccess) {
      return NextResponse.json({ error: 'admin_required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview' // overview 或 trends

    if (type === 'overview') {
      // 获取概览统计数据
      const [
        totalUsers,
        subscribedUsers,
        subscriptionRevenue,
        pointsPurchaseRevenue,
        totalPoints,
        totalReferrals,
        referralSubscribedCount,
        referralRewardPoints,
        affiliateCount,
        affiliateTotalEarnings,
        affiliateTotalWithdrawals,
        newsletterSubscribers,
      ] = await Promise.all([
        // 总用户数
        db.select({ count: count() }).from(users),
        // 总订阅用户数（当前有效的订阅）
        db
          .select({ count: count() })
          .from(users)
          .where(
            and(
              eq(users.subscriptionStatus, 'active'),
              isNotNull(users.subscriptionCurrentPeriodEnd),
              sql`${users.subscriptionCurrentPeriodEnd} > NOW()`
            )
          ),
        // 订阅总收入（美分）
        db
          .select({ total: sum(stripePayments.amount) })
          .from(stripePayments)
          .where(
            and(
              eq(stripePayments.paymentStatus, 'succeeded'),
              eq(stripePayments.paymentType, 'subscription')
            )
          ),
        // 积分购买总收入（美分）
        db
          .select({ total: sum(stripePayments.amount) })
          .from(stripePayments)
          .where(
            and(
              eq(stripePayments.paymentStatus, 'succeeded'),
              eq(stripePayments.paymentType, 'points_purchase')
            )
          ),
        // 总积分（所有用户的积分总和）
        db.select({ total: sum(users.points) }).from(users),
        // 总推荐数
        db.select({ count: count() }).from(referrals),
        // 推荐订阅人数
        db
          .select({ count: count() })
          .from(referrals)
          .where(eq(referrals.hasSubscribed, true)),
        // 推荐奖励总积分
        db
          .select({ total: sum(referralHistory.pointsAwarded) })
          .from(referralHistory)
          .where(eq(referralHistory.action, 'subscription_reward')),
        // 推广人数（有推广关系的用户数）
        db.select({ count: count() }).from(affiliateRelations),
        // 推广总佣金（美分）
        db.select({ total: sum(affiliateEarnings.amount) }).from(affiliateEarnings),
        // 总提现佣金（美分）
        db
          .select({ total: sum(affiliateWithdrawals.amount) })
          .from(affiliateWithdrawals)
          .where(eq(affiliateWithdrawals.status, 'COMPLETED')),
        // 邮箱订阅人数
        db
          .select({ count: count() })
          .from(newsletterSubscriptions)
          .where(eq(newsletterSubscriptions.isActive, true)),
      ])

      return NextResponse.json({
        totalUsers: totalUsers[0]?.count || 0,
        subscribedUsers: subscribedUsers[0]?.count || 0,
        subscriptionRevenue: Number(subscriptionRevenue[0]?.total || 0),
        pointsPurchaseRevenue: Number(pointsPurchaseRevenue[0]?.total || 0),
        totalPoints: Number(totalPoints[0]?.total || 0),
        totalReferrals: totalReferrals[0]?.count || 0,
        referralSubscribedCount: referralSubscribedCount[0]?.count || 0,
        referralRewardPoints: Number(referralRewardPoints[0]?.total || 0),
        affiliateCount: affiliateCount[0]?.count || 0,
        affiliateTotalEarnings: Number(affiliateTotalEarnings[0]?.total || 0),
        affiliateTotalWithdrawals: Number(affiliateTotalWithdrawals[0]?.total || 0),
        newsletterSubscribers: newsletterSubscribers[0]?.count || 0,
      })
    }

    if (type === 'trends') {
      // 获取时间趋势数据
      const days = parseInt(searchParams.get('days') || '30') // 默认30天
      const startDate = new Date()
      startDate.setHours(0, 0, 0, 0) // 设置为当天的开始时间
      startDate.setDate(startDate.getDate() - days)
      const endDate = new Date()
      endDate.setHours(23, 59, 59, 999) // 设置为当天的结束时间

      // 生成完整的日期范围数组
      const generateDateRange = (start: Date, end: Date): string[] => {
        const dates: string[] = []
        const current = new Date(start)
        while (current <= end) {
          const dateStr = current.toISOString().split('T')[0] // YYYY-MM-DD
          dates.push(dateStr)
          current.setDate(current.getDate() + 1)
        }
        return dates
      }

      const allDates = generateDateRange(startDate, endDate)

      // 注册人数趋势（按天）
      const registrationTrendsRaw = await db
        .select({
          date: sql<string>`DATE(${users.createdAt})::text`,
          count: sql<number>`COUNT(*)`,
        })
        .from(users)
        .where(gte(users.createdAt, startDate))
        .groupBy(sql`DATE(${users.createdAt})`)
        .orderBy(sql`DATE(${users.createdAt})`)

      // 将查询结果转换为 Map，方便查找
      const registrationMap = new Map<string, number>()
      registrationTrendsRaw.forEach((item) => {
        registrationMap.set(item.date, Number(item.count))
      })

      // 填充完整日期范围
      const registrationTrends = allDates.map((date) => ({
        date,
        count: registrationMap.get(date) || 0,
      }))

      // 开通订阅数趋势（按天，基于支付记录）
      const subscriptionTrendsRaw = await db
        .select({
          date: sql<string>`DATE(${stripePayments.createdAt})::text`,
          count: sql<number>`COUNT(*)`,
          revenue: sql<number>`SUM(${stripePayments.amount})`,
        })
        .from(stripePayments)
        .where(
          and(
            gte(stripePayments.createdAt, startDate),
            eq(stripePayments.paymentStatus, 'succeeded'),
            eq(stripePayments.paymentType, 'subscription')
          )
        )
        .groupBy(sql`DATE(${stripePayments.createdAt})`)
        .orderBy(sql`DATE(${stripePayments.createdAt})`)

      const subscriptionMap = new Map<string, { count: number; revenue: number }>()
      subscriptionTrendsRaw.forEach((item) => {
        subscriptionMap.set(item.date, {
          count: Number(item.count),
          revenue: Number(item.revenue),
        })
      })

      const subscriptionTrends = allDates.map((date) => {
        const data = subscriptionMap.get(date)
        return {
          date,
          count: data?.count || 0,
          revenue: data?.revenue || 0,
        }
      })

      // 总收入趋势（按天，包括订阅和积分购买）
      const revenueTrendsRaw = await db
        .select({
          date: sql<string>`DATE(${stripePayments.createdAt})::text`,
          revenue: sql<number>`SUM(${stripePayments.amount})`,
        })
        .from(stripePayments)
        .where(
          and(
            gte(stripePayments.createdAt, startDate),
            eq(stripePayments.paymentStatus, 'succeeded')
          )
        )
        .groupBy(sql`DATE(${stripePayments.createdAt})`)
        .orderBy(sql`DATE(${stripePayments.createdAt})`)

      const revenueMap = new Map<string, number>()
      revenueTrendsRaw.forEach((item) => {
        revenueMap.set(item.date, Number(item.revenue))
      })

      const revenueTrends = allDates.map((date) => ({
        date,
        revenue: revenueMap.get(date) || 0,
      }))

      return NextResponse.json({
        registrationTrends,
        subscriptionTrends,
        revenueTrends,
      })
    }

    return NextResponse.json({ error: 'invalid_type_param' }, { status: 400 })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return NextResponse.json(
      { error: 'fetch_statistics_failed' },
      { status: 500 }
    )
  }
}

