import { pgTable, text, timestamp, boolean, integer, primaryKey, index, unique, jsonb } from 'drizzle-orm/pg-core'
import type { AdapterAccount } from 'next-auth/adapters'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  password: text('password'),
  resetToken: text('resetToken'),
  resetTokenExpiry: timestamp('resetTokenExpiry', { mode: 'date' }),
  role: text('role').default('user'),
  points: integer('points').default(0), // 用户积分总数
  purchasedPoints: integer('purchasedPoints').default(0), // 购买的积分（永不过期）
  giftedPoints: integer('giftedPoints').default(0), // 赠送的积分（订阅到期清零）
  // 试用订阅标记：用户是否已经订阅（并消费）过一次 Trial
  hasTrialSubscription: boolean('hasTrialSubscription').notNull().default(false),
  // Stripe 相关字段
  stripeCustomerId: text('stripeCustomerId'),
  subscriptionId: text('subscriptionId'),
  subscriptionStatus: text('subscriptionStatus'), // active, cancelled, past_due, etc.
  subscriptionPlan: text('subscriptionPlan'), // pro, enterprise
  subscriptionCurrentPeriodEnd: timestamp('subscriptionCurrentPeriodEnd', { mode: 'date' }),
  // 推荐码相关字段
  referralCode: text('referralCode').unique(), // 用户的推荐码（唯一）
  referralCodeChanged: boolean('referralCodeChanged').default(false), // 是否已经修改过推荐码一次
  referredBy: text('referredBy'), // 邀请者的用户ID
  // 订阅到期提醒（cron 自动发邮件用）
  subscriptionUnsubscribeToken: text('subscription_unsubscribe_token'), // 退订链接的 token（首次创建或 cron 时生成）
  subscriptionReminderDisabled: boolean('subscription_reminder_disabled').notNull().default(false), // 是否关闭订阅到期提醒（一键全关）
  preferredLanguage: text('preferred_language').default('en'), // 邮件语言偏好：en | zh-CN | ja | ko | zh-TW
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow(),
})

export const accounts = pgTable('accounts', {
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').$type<AdapterAccount['type']>().notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (account) => ({
  compoundKey: primaryKey({
    columns: [account.provider, account.providerAccountId],
  }),
}))

export const sessions = pgTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable('verificationTokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
}))

export const emailVerificationTokens = pgTable('emailVerificationTokens', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
})

export const newsletterSubscriptions = pgTable('newsletterSubscriptions', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  isActive: boolean('isActive').default(true),
  locale: text('locale').notNull().default('en'), // 用户订阅时的语言偏好：en | zh-CN | ja | ko | zh-TW
  subscribedAt: timestamp('subscribedAt', { mode: 'date' }).defaultNow(),
  unsubscribedAt: timestamp('unsubscribedAt', { mode: 'date' }),
  unsubscribeToken: text('unsubscribeToken').unique(), // 用于取消订阅的令牌
})

export const pointsHistory = pgTable('pointsHistory', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  points: integer('points').notNull(), // 积分变动数量（正数为增加，负数为扣除）
  pointsType: text('pointsType').notNull().default('purchased'), // 积分类型：purchased(购买), gifted(赠送)
  action: text('action').notNull(), // 操作类型：register, email_verify, daily_login, referral, manual, purchase, subscription_gift, subscription_expired等
  description: text('description'), // 操作描述
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
})

// Stripe支付记录表
export const stripePayments = pgTable('stripePayments', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripeCustomerId').notNull(),
  paymentIntentId: text('paymentIntentId'),
  checkoutSessionId: text('checkoutSessionId'),
  subscriptionId: text('subscriptionId'),
  invoiceId: text('invoiceId'),
  paymentStatus: text('paymentStatus').notNull(), // succeeded, failed, pending, refunded等
  paymentType: text('paymentType').notNull(), // subscription, points_purchase, one_time等
  amount: integer('amount').notNull(), // 支付金额（分为单位）
  currency: text('currency').notNull().default('usd'),
  productName: text('productName'),
  productDescription: text('productDescription'),
  priceId: text('priceId'),
  pointsAmount: integer('pointsAmount'), // 购买的积分数量
  pointsType: text('pointsType'), // purchased, gifted
  subscriptionPlan: text('subscriptionPlan'), // pro, enterprise
  subscriptionPeriodStart: timestamp('subscriptionPeriodStart', { mode: 'date' }),
  subscriptionPeriodEnd: timestamp('subscriptionPeriodEnd', { mode: 'date' }),
  refundAmount: integer('refundAmount'), // 退款金额（分为单位）
  refundReason: text('refundReason'),
  refundedAt: timestamp('refundedAt', { mode: 'date' }),
  metadata: text('metadata'), // JSON字符串，存储额外信息
  webhookEventId: text('webhookEventId'), // Stripe webhook事件ID
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow(),
})

// 邀请关系表 - 追踪邀请者和被邀请者的关系
export const referrals = pgTable('referrals', {
  id: text('id').primaryKey(),
  referrerId: text('referrerId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // 邀请者ID
  referredId: text('referredId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // 被邀请者ID
  referralCode: text('referralCode').notNull(), // 使用的推荐码
  hasSubscribed: boolean('hasSubscribed').default(false), // 被邀请者是否已订阅
  subscriptionRewarded: boolean('subscriptionRewarded').default(false), // 是否已给邀请者发放订阅奖励
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow(),
})

// 邀请历史记录表 - 记录邀请相关的所有操作
export const referralHistory = pgTable('referralHistory', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // 操作相关的用户ID（邀请者或被邀请者）
  referralId: text('referralId')
    .references(() => referrals.id, { onDelete: 'cascade' }), // 关联的邀请关系ID
  action: text('action').notNull(), // 操作类型：register_bonus(注册奖励), subscription_reward(订阅返利)
  description: text('description'), // 操作描述
  pointsAwarded: integer('pointsAwarded'), // 奖励的积分（如果有）
  subscriptionDaysExtended: integer('subscriptionDaysExtended'), // 延长的订阅天数（如果有）
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
})

// ========== 推广返利系统 (Affiliate System) - 完全独立于现有推荐系统 ==========

// 推广人资料表
export const affiliateProfiles = pgTable('affiliate_profiles', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(), // 一个用户只能有一个推广资料
  code: text('code').notNull().unique(), // 推广码（唯一）
  codeChanged: boolean('codeChanged').notNull().default(false), // 推广码是否已修改过（只能修改一次）
  balance: integer('balance').notNull().default(0), // 可用余额（分为单位）
  frozenBalance: integer('frozenBalance').notNull().default(0), // 冻结余额（分为单位）
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow(),
}, (table) => ({
  codeIdx: index('affiliate_code_idx').on(table.code),
  userIdIdx: index('affiliate_user_id_idx').on(table.userId),
}))

// 推广关系表 - 追踪推广人和被推广人的关系
export const affiliateRelations = pgTable('affiliate_relations', {
  id: text('id').primaryKey(),
  referrerId: text('referrerId')
    .notNull()
    .references(() => affiliateProfiles.id, { onDelete: 'cascade' }), // 推广人ID（关联affiliate_profiles）
  inviteeId: text('inviteeId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(), // 被推广人ID（关联users，确保一个用户只被绑定一次）
  expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(), // 关系过期时间（注册后30天）
  hasConverted: boolean('hasConverted').notNull().default(false), // 是否已转化（首单完成）
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow(),
}, (table) => ({
  referrerIdx: index('affiliate_relation_referrer_idx').on(table.referrerId),
  inviteeIdx: index('affiliate_relation_invitee_idx').on(table.inviteeId),
  inviteeUnique: unique('affiliate_relation_invitee_unique').on(table.inviteeId),
}))

// 推广佣金记录表
export const affiliateEarnings = pgTable('affiliate_earnings', {
  id: text('id').primaryKey(),
  affiliateId: text('affiliateId')
    .notNull()
    .references(() => affiliateProfiles.id, { onDelete: 'cascade' }), // 推广人ID
  amount: integer('amount').notNull(), // 佣金金额（分为单位）
  status: text('status').notNull().default('FROZEN'), // 状态：FROZEN(冻结), RELEASED(已解冻), CANCELLED(已取消)
  releaseDate: timestamp('releaseDate', { mode: 'date' }).notNull(), // 解冻日期（7天后）
  stripeOrderId: text('stripeOrderId'), // Stripe订单ID（用于退款匹配）
  relationId: text('relationId')
    .references(() => affiliateRelations.id, { onDelete: 'set null' }), // 关联的推广关系ID
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow(),
}, (table) => ({
  affiliateIdx: index('affiliate_earning_affiliate_idx').on(table.affiliateId),
  statusIdx: index('affiliate_earning_status_idx').on(table.status),
  releaseDateIdx: index('affiliate_earning_release_date_idx').on(table.releaseDate),
  stripeOrderIdx: index('affiliate_earning_stripe_order_idx').on(table.stripeOrderId),
}))

// ========== Relations 定义 ==========

// ========== 沉睡用户召回系统 ==========

// 召回活动配置表
export const reengagementCampaigns = pgTable('reengagement_campaigns', {
  id: text('id').primaryKey(),
  name: text('name').notNull(), // 活动名称
  bucket: text('bucket').notNull(), // warm | dormant | inactive | churned
  // 内容：5 个语言的模板，key 为语言代码，value 为该语言的主题和正文
  content: jsonb('content').$type<Record<string, { subject: string; heading: string; body: string; cta: string; footer: string }>>(),
  // 发送统计
  targetCount: integer('target_count').notNull().default(0), // 目标用户数
  sentCount: integer('sent_count').notNull().default(0), // 已发送数
  failedCount: integer('failed_count').notNull().default(0), // 失败数
  // 状态：draft(草稿) | ready(待发送) | sending(发送中) | completed(已完成) | cancelled(已取消)
  status: text('status').notNull().default('draft'),
  // 时间
  scheduledAt: timestamp('scheduled_at', { mode: 'date' }), // 计划发送时间
  startedAt: timestamp('started_at', { mode: 'date' }), // 开始发送时间
  completedAt: timestamp('completed_at', { mode: 'date' }), // 完成时间
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
}, (table) => ({
  idxBucket: index('idx_campaign_bucket').on(table.bucket),
  idxStatus: index('idx_campaign_status').on(table.status),
  idxScheduledAt: index('idx_campaign_scheduled_at').on(table.scheduledAt),
}))

// 召回邮件发送记录表
export const reengagementLogs = pgTable('reengagement_logs', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id')
    .notNull()
    .references(() => reengagementCampaigns.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  locale: text('locale').notNull(),
  bucket: text('bucket').notNull(), // 用户所属的分组
  // 发送状态：pending | sent | failed | bounced | unsubscribed
  status: text('status').notNull().default('pending'),
  messageId: text('message_id'), // Resend 消息 ID
  errorMessage: text('error_message'), // 失败原因
  sentAt: timestamp('sent_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
}, (table) => ({
  idxCampaignId: index('idx_relog_campaign_id').on(table.campaignId),
  idxUserId: index('idx_relog_user_id').on(table.userId),
  idxStatus: index('idx_relog_status').on(table.status),
  idxSentAt: index('idx_relog_sent_at').on(table.sentAt),
}))

export const reengagementCampaignsRelations = relations(reengagementCampaigns, ({ many }) => ({
  logs: many(reengagementLogs),
}))

export const reengagementLogsRelations = relations(reengagementLogs, ({ one }) => ({
  campaign: one(reengagementCampaigns, {
    fields: [reengagementLogs.campaignId],
    references: [reengagementCampaigns.id],
  }),
  user: one(users, {
    fields: [reengagementLogs.userId],
    references: [users.id],
  }),
}))

export const affiliateProfilesRelations = relations(affiliateProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [affiliateProfiles.userId],
    references: [users.id],
  }),
  relations: many(affiliateRelations),
  earnings: many(affiliateEarnings),
  withdrawals: many(affiliateWithdrawals),
}))

export const affiliateRelationsRelations = relations(affiliateRelations, ({ one, many }) => ({
  referrer: one(affiliateProfiles, {
    fields: [affiliateRelations.referrerId],
    references: [affiliateProfiles.id],
  }),
  invitee: one(users, {
    fields: [affiliateRelations.inviteeId],
    references: [users.id],
  }),
  earnings: many(affiliateEarnings),
}))

export const affiliateEarningsRelations = relations(affiliateEarnings, ({ one }) => ({
  affiliate: one(affiliateProfiles, {
    fields: [affiliateEarnings.affiliateId],
    references: [affiliateProfiles.id],
  }),
  relation: one(affiliateRelations, {
    fields: [affiliateEarnings.relationId],
    references: [affiliateRelations.id],
  }),
}))

// 提现记录表
export const affiliateWithdrawals = pgTable('affiliate_withdrawals', {
  id: text('id').primaryKey(),
  affiliateId: text('affiliateId')
    .notNull()
    .references(() => affiliateProfiles.id, { onDelete: 'cascade' }), // 推广人ID
  amount: integer('amount').notNull(), // 提现金额（美分为单位）
  status: text('status').notNull().default('PENDING'), // 状态：PENDING(待处理), PROCESSING(处理中), COMPLETED(已完成), FAILED(失败), CANCELLED(已取消)
  paymentMethod: text('paymentMethod').notNull(), // 支付方式：alipay, paypal等
  accountName: text('accountName').notNull(), // 账户姓名
  accountInfo: text('accountInfo').notNull(), // 账户信息（支付宝账号、PayPal邮箱等）
  transactionId: text('transactionId'), // 第三方交易ID
  failureReason: text('failureReason'), // 失败原因
  processedAt: timestamp('processedAt', { mode: 'date' }), // 处理完成时间
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow(),
}, (table) => ({
  affiliateIdx: index('affiliate_withdrawal_affiliate_idx').on(table.affiliateId),
  statusIdx: index('affiliate_withdrawal_status_idx').on(table.status),
  createdAtIdx: index('affiliate_withdrawal_created_at_idx').on(table.createdAt),
}))

export const affiliateWithdrawalsRelations = relations(affiliateWithdrawals, ({ one }) => ({
  affiliate: one(affiliateProfiles, {
    fields: [affiliateWithdrawals.affiliateId],
    references: [affiliateProfiles.id],
  }),
}))

// ========== 订阅到期提醒系统 ==========

// 提醒发送日志：保证同一用户同一订阅周期同一类型邮件不会重复发送
export const subscriptionReminders = pgTable('subscription_reminders', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  periodEnd: timestamp('period_end', { mode: 'date' }).notNull(),
  reminderType: text('reminder_type').notNull(), // 7d | 3d | today
  sentAt: timestamp('sent_at', { mode: 'date' }).notNull(),
  emailMessageId: text('email_message_id'), // Resend 返回的消息 ID，用于排错
  // admin 后台展示用
  subject: text('subject'), // 邮件主题
  locale: text('locale'), // 邮件语言（en/zh-CN/ja/ko/zh-TW）
  plan: text('plan'), // 订阅计划（pro/enterprise 等）
}, (table) => ({
  uniqUserPeriodType: unique('uniq_user_period_type').on(
    table.userId,
    table.periodEnd,
    table.reminderType,
  ),
  idxSentAt: index('idx_reminders_sent_at').on(table.sentAt),
  idxMessageId: index('idx_reminders_message_id').on(table.emailMessageId),
})) 