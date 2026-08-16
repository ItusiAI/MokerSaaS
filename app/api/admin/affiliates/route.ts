import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { affiliateProfiles, affiliateRelations, affiliateEarnings, affiliateWithdrawals, users } from '@/lib/schema'
import { eq, desc, count, sum, sql } from 'drizzle-orm'
import { isAdmin } from '@/lib/auth-utils'
import { sendWithdrawStatusEmail } from '@/lib/email'

function normalizeAppLocale(input: unknown, fallback: 'en' | 'zh' | 'ja' | 'ko' | 'tw' = 'en'): 'en' | 'zh' | 'ja' | 'ko' | 'tw' {
  if (typeof input === 'string' && (['en', 'zh', 'ja', 'ko', 'tw'] as const).includes(input as any)) {
    return input as 'en' | 'zh' | 'ja' | 'ko' | 'tw'
  }
  return fallback
}

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminAccess = await isAdmin()
    if (!adminAccess) {
      return NextResponse.json(
        { error: 'admin_required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    if (action === 'stats') {
      // 获取推广统计数据
      const [totalProfiles, totalRelations, convertedRelations, totalEarnings, totalWithdrawals] = await Promise.all([
        db.select({ count: count() }).from(affiliateProfiles),
        db.select({ count: count() }).from(affiliateRelations),
        db.select({ count: count() }).from(affiliateRelations).where(eq(affiliateRelations.hasConverted, true)),
        db.select({ total: sum(affiliateEarnings.amount) }).from(affiliateEarnings),
        db.select({ total: sum(affiliateWithdrawals.amount) }).from(affiliateWithdrawals)
      ])

      return NextResponse.json({
        totalProfiles: totalProfiles[0]?.count || 0,
        totalRelations: totalRelations[0]?.count || 0,
        convertedRelations: convertedRelations[0]?.count || 0,
        totalEarnings: Number(totalEarnings[0]?.total || 0),
        totalWithdrawals: Number(totalWithdrawals[0]?.total || 0),
      })
    }

    if (action === 'profiles') {
      // 获取推广人资料列表
      const offset = (page - 1) * limit

      const profiles = await db
        .select({
          id: affiliateProfiles.id,
          userId: affiliateProfiles.userId,
          code: affiliateProfiles.code,
          codeChanged: affiliateProfiles.codeChanged,
          balance: affiliateProfiles.balance,
          frozenBalance: affiliateProfiles.frozenBalance,
          createdAt: affiliateProfiles.createdAt,
          updatedAt: affiliateProfiles.updatedAt,
        })
        .from(affiliateProfiles)
        .orderBy(desc(affiliateProfiles.createdAt))
        .limit(limit)
        .offset(offset)

      // 获取用户信息
      const profilesWithUserInfo = await Promise.all(
        profiles.map(async (profile) => {
          const user = await db
            .select({
              name: users.name,
              email: users.email,
            })
            .from(users)
            .where(eq(users.id, profile.userId))
            .limit(1)

          return {
            ...profile,
            userName: user[0]?.name || null,
            userEmail: user[0]?.email || null,
          }
        })
      )

      // 获取总数
      const totalProfiles = await db.select({ count: count() }).from(affiliateProfiles)

      return NextResponse.json({
        profiles: profilesWithUserInfo,
        pagination: {
          page,
          limit,
          total: totalProfiles[0]?.count || 0,
          totalPages: Math.ceil((totalProfiles[0]?.count || 0) / limit),
        },
      })
    }

    if (action === 'relations') {
      // 获取推广关系列表
      const offset = (page - 1) * limit

      const relations = await db
        .select({
          id: affiliateRelations.id,
          referrerId: affiliateRelations.referrerId,
          inviteeId: affiliateRelations.inviteeId,
          expiresAt: affiliateRelations.expiresAt,
          hasConverted: affiliateRelations.hasConverted,
          createdAt: affiliateRelations.createdAt,
        })
        .from(affiliateRelations)
        .orderBy(desc(affiliateRelations.createdAt))
        .limit(limit)
        .offset(offset)

      // 获取用户信息
      const relationsWithUserInfo = await Promise.all(
        relations.map(async (relation) => {
          const [referrer, invitee] = await Promise.all([
            db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, relation.referrerId)).limit(1),
            db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, relation.inviteeId)).limit(1),
          ])

          return {
            ...relation,
            referrerName: referrer[0]?.name || null,
            referrerEmail: referrer[0]?.email || null,
            inviteeName: invitee[0]?.name || null,
            inviteeEmail: invitee[0]?.email || null,
          }
        })
      )

      // 获取总数
      const totalRelations = await db.select({ count: count() }).from(affiliateRelations)

      return NextResponse.json({
        relations: relationsWithUserInfo,
        pagination: {
          page,
          limit,
          total: totalRelations[0]?.count || 0,
          totalPages: Math.ceil((totalRelations[0]?.count || 0) / limit),
        },
      })
    }

    if (action === 'earnings') {
      // 获取佣金记录列表
      const offset = (page - 1) * limit

      const earnings = await db
        .select({
          id: affiliateEarnings.id,
          affiliateId: affiliateEarnings.affiliateId,
          amount: affiliateEarnings.amount,
          status: affiliateEarnings.status,
          releaseDate: affiliateEarnings.releaseDate,
          stripeOrderId: affiliateEarnings.stripeOrderId,
          relationId: affiliateEarnings.relationId,
          createdAt: affiliateEarnings.createdAt,
        })
        .from(affiliateEarnings)
        .orderBy(desc(affiliateEarnings.createdAt))
        .limit(limit)
        .offset(offset)

      // 获取关联信息
      const earningsWithInfo = await Promise.all(
        earnings.map(async (earning) => {
          // 获取推广人信息
          const profile = await db
            .select({
              userId: affiliateProfiles.userId,
            })
            .from(affiliateProfiles)
            .where(eq(affiliateProfiles.id, earning.affiliateId))
            .limit(1)

          let affiliateUser = null
          if (profile[0]?.userId) {
            const user = await db
              .select({
                name: users.name,
                email: users.email,
              })
              .from(users)
              .where(eq(users.id, profile[0].userId))
              .limit(1)
            affiliateUser = user[0] || null
          }

          // 获取被推广人信息
          let inviteeUser = null
          if (earning.relationId) {
            const relation = await db
              .select({
                inviteeId: affiliateRelations.inviteeId,
              })
              .from(affiliateRelations)
              .where(eq(affiliateRelations.id, earning.relationId))
              .limit(1)

            if (relation[0]?.inviteeId) {
              const user = await db
                .select({
                  name: users.name,
                  email: users.email,
                })
                .from(users)
                .where(eq(users.id, relation[0].inviteeId))
                .limit(1)
              inviteeUser = user[0] || null
            }
          }

          return {
            ...earning,
            affiliateUserName: affiliateUser?.name || null,
            affiliateUserEmail: affiliateUser?.email || null,
            inviteeUserName: inviteeUser?.name || null,
            inviteeUserEmail: inviteeUser?.email || null,
          }
        })
      )

      // 获取总数
      const totalEarnings = await db.select({ count: count() }).from(affiliateEarnings)

      return NextResponse.json({
        earnings: earningsWithInfo,
        pagination: {
          page,
          limit,
          total: totalEarnings[0]?.count || 0,
          totalPages: Math.ceil((totalEarnings[0]?.count || 0) / limit),
        },
      })
    }

    if (action === 'withdrawals') {
      // 获取提现记录列表
      const offset = (page - 1) * limit

      const withdrawals = await db
        .select({
          id: affiliateWithdrawals.id,
          affiliateId: affiliateWithdrawals.affiliateId,
          amount: affiliateWithdrawals.amount,
          status: affiliateWithdrawals.status,
          paymentMethod: affiliateWithdrawals.paymentMethod,
          accountName: affiliateWithdrawals.accountName,
          accountInfo: affiliateWithdrawals.accountInfo,
          transactionId: affiliateWithdrawals.transactionId,
          failureReason: affiliateWithdrawals.failureReason,
          processedAt: affiliateWithdrawals.processedAt,
          createdAt: affiliateWithdrawals.createdAt,
        })
        .from(affiliateWithdrawals)
        .orderBy(desc(affiliateWithdrawals.createdAt))
        .limit(limit)
        .offset(offset)

      // 获取推广人信息
      const withdrawalsWithUserInfo = await Promise.all(
        withdrawals.map(async (withdrawal) => {
          const profile = await db
            .select({
              userId: affiliateProfiles.userId,
            })
            .from(affiliateProfiles)
            .where(eq(affiliateProfiles.id, withdrawal.affiliateId))
            .limit(1)

          let user = null
          if (profile[0]?.userId) {
            const userData = await db
              .select({
                name: users.name,
                email: users.email,
              })
              .from(users)
              .where(eq(users.id, profile[0].userId))
              .limit(1)
            user = userData[0] || null
          }

          return {
            ...withdrawal,
            userName: user?.name || null,
            userEmail: user?.email || null,
          }
        })
      )

      // 获取总数
      const totalWithdrawals = await db.select({ count: count() }).from(affiliateWithdrawals)

      return NextResponse.json({
        withdrawals: withdrawalsWithUserInfo,
        pagination: {
          page,
          limit,
          total: totalWithdrawals[0]?.count || 0,
          totalPages: Math.ceil((totalWithdrawals[0]?.count || 0) / limit),
        },
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in admin affiliates API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * 处理提现申请（更新状态）
 * 支持的状态：PROCESSING, COMPLETED, FAILED, CANCELLED
 */
export async function PATCH(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminAccess = await isAdmin()
    if (!adminAccess) {
      return NextResponse.json(
        { error: 'admin_required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { withdrawalId, status, transactionId, failureReason, locale } = body

    // 验证必填字段
    if (!withdrawalId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 验证状态值
    const validStatuses = ['PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // 获取提现记录
    const withdrawal = await db
      .select()
      .from(affiliateWithdrawals)
      .where(eq(affiliateWithdrawals.id, withdrawalId))
      .limit(1)

    if (withdrawal.length === 0) {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 }
      )
    }

    const currentWithdrawal = withdrawal[0]

    // 如果状态已经是最终状态，不允许修改
    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(currentWithdrawal.status)) {
      return NextResponse.json(
        { error: 'Cannot modify finalized withdrawal' },
        { status: 400 }
      )
    }

    // 如果设置为失败或取消，需要恢复余额
    if (status === 'FAILED' || status === 'CANCELLED') {
      // 恢复推广人余额
      await db
        .update(affiliateProfiles)
        .set({
          balance: sql`${affiliateProfiles.balance} + ${currentWithdrawal.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(affiliateProfiles.id, currentWithdrawal.affiliateId))
    }

    // 更新提现记录
    const updateData: any = {
      status,
      updatedAt: new Date(),
    }

    if (transactionId) {
      updateData.transactionId = transactionId
    }

    if (failureReason) {
      updateData.failureReason = failureReason
    }

    if (status === 'COMPLETED' || status === 'FAILED') {
      updateData.processedAt = new Date()
    }

    await db
      .update(affiliateWithdrawals)
      .set(updateData)
      .where(eq(affiliateWithdrawals.id, withdrawalId))

    // 查询用户邮箱等信息用于通知
    try {
      const profile = await db
        .select({ userId: affiliateProfiles.userId })
        .from(affiliateProfiles)
        .where(eq(affiliateProfiles.id, currentWithdrawal.affiliateId))
        .limit(1)

      const userId = profile[0]?.userId

      if (userId) {
        const user = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)

        const email = user[0]?.email

        if (email) {
          await sendWithdrawStatusEmail({
            email,
            amountInCents: currentWithdrawal.amount,
            paymentMethod: currentWithdrawal.paymentMethod,
            accountName: currentWithdrawal.accountName,
            accountInfo: currentWithdrawal.accountInfo,
            status: status,
            note: failureReason || null,
            locale: normalizeAppLocale(locale, 'en'),
          })
        }
      }
    } catch (notifyError) {
      console.error('Failed to send withdraw status email:', notifyError)
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal updated successfully',
    })
  } catch (error) {
    console.error('Error processing withdrawal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

