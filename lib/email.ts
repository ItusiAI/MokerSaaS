import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set')
}

const resend = new Resend(process.env.RESEND_API_KEY)

// 邮件发送频率限制配置
const RATE_LIMIT_CONFIG = {
  verification: {
    maxPerEmail: 3, // 每个邮箱每小时最多3次
    maxPerIP: 10, // 每个IP每小时最多10次
    windowMinutes: 60, // 时间窗口：60分钟
  },
  password_reset: {
    maxPerEmail: 3, // 每个邮箱每小时最多3次
    maxPerIP: 10, // 每个IP每小时最多10次
    windowMinutes: 60, // 时间窗口：60分钟
  },
} as const

type EmailType = 'verification' | 'password_reset'

// 内存缓存：存储频率限制记录
// 格式: Map<key, timestamp[]>
// key 格式: `${emailType}:${email}` 或 `${emailType}:ip:${ipAddress}`
const rateLimitCache = new Map<string, number[]>()

// 清理过期的频率限制记录
function cleanupExpiredRecords(emailType: EmailType) {
  const config = RATE_LIMIT_CONFIG[emailType]
  const cutoffTime = Date.now() - config.windowMinutes * 60 * 1000

  for (const [key, timestamps] of rateLimitCache.entries()) {
    if (key.startsWith(`${emailType}:`)) {
      // 过滤掉过期的记录
      const validTimestamps = timestamps.filter(ts => ts > cutoffTime)
      
      if (validTimestamps.length === 0) {
        // 如果没有有效记录，删除这个key
        rateLimitCache.delete(key)
      } else {
        // 更新为有效记录
        rateLimitCache.set(key, validTimestamps)
      }
    }
  }
}

// 检查邮件发送频率限制
function checkEmailRateLimit(
  email: string,
  emailType: EmailType,
  ipAddress?: string
): { allowed: boolean; error?: string } {
  const config = RATE_LIMIT_CONFIG[emailType]
  const cutoffTime = Date.now() - config.windowMinutes * 60 * 1000

  try {
    // 清理过期记录（每次检查时清理，但可以优化为定期清理）
    cleanupExpiredRecords(emailType)

    // 检查同一邮箱在时间窗口内的发送次数
    const emailKey = `${emailType}:${email}`
    const emailTimestamps = rateLimitCache.get(emailKey) || []
    const recentEmailCount = emailTimestamps.filter(ts => ts > cutoffTime).length

    if (recentEmailCount >= config.maxPerEmail) {
      return {
        allowed: false,
        error: `Too many ${emailType} emails sent. Please try again later.`,
      }
    }

    // 如果提供了IP地址，检查同一IP在时间窗口内的发送次数
    if (ipAddress) {
      const ipKey = `${emailType}:ip:${ipAddress}`
      const ipTimestamps = rateLimitCache.get(ipKey) || []
      const recentIPCount = ipTimestamps.filter(ts => ts > cutoffTime).length

      if (recentIPCount >= config.maxPerIP) {
        return {
          allowed: false,
          error: `Too many ${emailType} emails sent from this IP. Please try again later.`,
        }
      }
    }

    // 记录本次发送
    const now = Date.now()
    
    // 更新邮箱记录（创建新数组以避免直接修改引用）
    const updatedEmailTimestamps = [...emailTimestamps.filter(ts => ts > cutoffTime), now]
    rateLimitCache.set(emailKey, updatedEmailTimestamps)

    // 更新IP记录（如果提供了IP）
    if (ipAddress) {
      const ipKey = `${emailType}:ip:${ipAddress}`
      const ipTimestamps = rateLimitCache.get(ipKey) || []
      const updatedIPTimestamps = [...ipTimestamps.filter(ts => ts > cutoffTime), now]
      rateLimitCache.set(ipKey, updatedIPTimestamps)
    }

    return { allowed: true }
  } catch (error) {
    console.error('检查邮件频率限制时出错:', error)
    // 如果检查失败，为了不影响正常流程，允许发送（但记录错误）
    return { allowed: true }
  }
}

const BRAND_COLORS = {
  primary: '#00D4E7',
  primaryDark: '#00F0FF',
  background: '#FAFAFA',
  backgroundDark: '#1A1A1A',
  text: '#262626',
  muted: '#64748B'
}

function extractBrandNameFromEmail() {
  const fromEmail = process.env.RESEND_FROM_EMAIL
  if (fromEmail) {
    const match = fromEmail.match(/"?([^"<]+?)"?\s*<[^>]+>/)
    if (match?.[1]) {
      return match[1].trim()
    }
    return fromEmail.replace(/["']/g, '').trim()
  }
  return 'MokerSaaS'
}

const BRAND_NAME =
  (process.env.RESEND_BRAND_NAME && process.env.RESEND_BRAND_NAME.trim()) ||
  extractBrandNameFromEmail()

const getFromAddress = () =>
  process.env.RESEND_FROM_EMAIL || `${BRAND_NAME} <onboarding@resend.dev>`

// 邮件模板配置
const emailTemplates = {
  verification: {
    zh: {
      subject: `欢迎加入 ${BRAND_NAME} - 请验证邮箱`,
      title: '确认您的邮箱',
      subtitle: `${BRAND_NAME} 想和你一起打造全球化产品`,
      greeting: `你好！只需点击下方按钮即可完成邮箱验证，我们已经迫不及待想让你体验 ${BRAND_NAME} 的全部功能了。`,
      buttonText: '立即验证邮箱',
      linkText: '如果按钮无法点击，请复制以下链接到浏览器：',
      footer1: '这是一次性验证邮件，请勿直接回复。',
      footer2: `如需帮助，可以通过官网或应用内的支持渠道联系 ${BRAND_NAME} 团队。`
    },
    en: {
      subject: `Welcome to ${BRAND_NAME} – Please Verify Your Email`,
      title: 'Confirm Your Email',
      subtitle: `${BRAND_NAME} is here to help you build global products`,
      greeting: `Hi there! Tap the button below to finish verifying your email so you can enjoy everything ${BRAND_NAME} offers.`,
      buttonText: 'Verify Email',
      linkText: 'If the button doesn’t work, copy and paste this link into your browser:',
      footer1: 'This is a one-time verification email, please do not reply directly.',
      footer2: `Need help? Visit our help center or contact the ${BRAND_NAME} support team from within the app.`
    }
  },
  passwordReset: {
    zh: {
      subject: `重设 ${BRAND_NAME} 密码`,
      title: '我们在这里帮你找回访问权限',
      subtitle: '别担心，几步内即可完成密码重设',
      greeting: `您提出了密码重置请求，点击下方按钮就能设置一个全新的密码。若不是您本人操作，可放心忽略此邮件。`,
      buttonText: '重置密码',
      linkText: '如果按钮无法点击，请复制以下链接到浏览器：',
      footer1: `来自 ${BRAND_NAME} 的温馨提醒：确保密码安全，别与他人共享。`,
      footer2: '如果需要进一步帮助，可以通过官网或应用内的支持渠道联系我们。'
    },
    en: {
      subject: `Reset Your ${BRAND_NAME} Password`,
      title: 'We’re ready to get you back in',
      subtitle: 'A fresh password is just a click away',
      greeting: `You asked to reset your password. Hit the button below to choose a new one. If you didn’t make this request, feel free to ignore this email.`,
      buttonText: 'Reset Password',
      linkText: 'If the button doesn’t work, copy and paste this link into your browser:',
      footer1: `Friendly reminder from ${BRAND_NAME}: keep your password safe and never share it.`,
      footer2: 'Need a hand? Reach out through our in‑app support or help center and we’ll assist you.'
    }
  },
  pointsPurchase: {
    zh: {
      subject: `积分已到账 - 感谢支持 ${BRAND_NAME}`,
      title: '积分充值成功',
      subtitle: `让 ${BRAND_NAME} 的积分助你发挥更多创意`,
      greeting: '积分已经安全添加到你的账户，随时都可以用来探索新的功能。',
      footer1: '祝你使用愉快，如需帮助我们一直都在。',
      footer2: `– ${BRAND_NAME} 团队`,
      pointsLabel: '充值积分',
      amountLabel: '支付金额',
      successMessage: '积分已经到账，祝你玩得开心，创意不断。'
    },
    en: {
      subject: `Your credits are ready – Thanks for trusting ${BRAND_NAME}`,
      title: 'Points Purchase Successful',
      subtitle: `${BRAND_NAME} credits are now in your wallet`,
      greeting: 'Your credits have safely landed in your account. They’re ready whenever inspiration strikes.',
      footer1: 'Have fun creating, and let us know if you need anything.',
      footer2: `– The ${BRAND_NAME} team`,
      pointsLabel: 'Credits Added',
      amountLabel: 'Amount Paid',
      successMessage: 'Everything is set! Your new credits are ready to power your next idea.'
    }
  },
  subscriptionSuccess: {
    zh: {
      subject: `订阅成功 - ${BRAND_NAME} 陪你长期成长`,
      title: '订阅已经激活',
      subtitle: '欢迎继续和我们一起探索更多可能',
      greeting: '订阅生效啦！下面是你的订阅详情，我们会持续为你提供更好的体验。',
      footer1: '感谢信任，我们会继续加油。',
      footer2: `– ${BRAND_NAME} 团队`,
      planLabel: '订阅版本',
      expiresLabel: '到期时间',
      amountLabel: '支付金额',
      successMessage: '订阅已激活，所有高级功能已经为你开放。'
    },
    en: {
      subject: `Subscription Confirmed – Growing together with ${BRAND_NAME}`,
      title: 'Your subscription is live',
      subtitle: 'Thanks for choosing to build with us',
      greeting: 'You’re all set! Here’s a quick look at your plan details. We’ll keep improving so you get even more value.',
      footer1: 'Thank you for being part of our journey.',
      footer2: `– The ${BRAND_NAME} team`,
      planLabel: 'Plan',
      expiresLabel: 'Renews On',
      amountLabel: 'Amount Paid',
      successMessage: 'Premium features are unlocked—have fun exploring!'
    }
  },
  withdrawRequestAdmin: {
    zh: {
      subject: `有新的提现申请待审核 - ${BRAND_NAME}`,
      title: '新的提现申请',
      subtitle: '有推广用户发起了新的提现申请，请尽快在后台处理',
      greeting: '我们在系统中收到了以下提现申请，请登录后台「推广管理 - 提现管理」查看详情并完成审核/打款。',
      footer1: '本邮件仅用于通知管理员，请勿转发给其他用户。',
      footer2: `– ${BRAND_NAME} 系统通知`,
      userLabel: '申请用户',
      emailLabel: '用户邮箱',
      amountLabel: '提现金额',
      methodLabel: '收款方式',
      accountLabel: '收款账户',
      timeLabel: '申请时间'
    },
    en: {
      subject: `New withdrawal request pending review – ${BRAND_NAME}`,
      title: 'New Withdrawal Request',
      subtitle: 'An affiliate has submitted a new withdrawal request',
      greeting: 'We have received the following withdrawal request. Please sign in to the admin console (Affiliate → Withdrawals) to review and process it.',
      footer1: 'This email is for admin notification only and should not be forwarded to end users.',
      footer2: `– ${BRAND_NAME} System`,
      userLabel: 'User',
      emailLabel: 'Email',
      amountLabel: 'Amount',
      methodLabel: 'Payment Method',
      accountLabel: 'Payout Account',
      timeLabel: 'Requested At'
    }
  },
  withdrawStatusUser: {
    zh: {
      subject: `提现申请状态更新 - ${BRAND_NAME}`,
      title: '提现审核进度更新',
      subtitle: '你的提现申请有了最新进展',
      greeting: '我们已经更新了本次提现申请的处理结果，下面是本次提现的最新状态和关键信息。',
      footer1: '感谢你的耐心等待，我们会持续优化提现体验。',
      footer2: `– ${BRAND_NAME} 团队`,
      amountLabel: '提现金额',
      statusLabel: '当前状态',
      methodLabel: '收款方式',
      accountLabel: '收款账户',
      noteLabel: '备注说明'
    },
    en: {
      subject: `Your withdrawal status has been updated – ${BRAND_NAME}`,
      title: 'Withdrawal Status Update',
      subtitle: 'There is a new update on your withdrawal request',
      greeting: 'We’ve updated the status of this withdrawal request. Here are the latest details for your reference.',
      footer1: 'Thanks for your patience. We’re always working to make payouts smoother.',
      footer2: `– The ${BRAND_NAME} Team`,
      amountLabel: 'Amount',
      statusLabel: 'Status',
      methodLabel: 'Payment Method',
      accountLabel: 'Payout Account',
      noteLabel: 'Notes'
    }
  }
}

// 生成邮件HTML模板
function generateEmailTemplate(
  url: string,
  template: typeof emailTemplates.verification.zh
): string {
  const colors = BRAND_COLORS
  
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${template.subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px; padding: 20px 0;">
          <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); border-radius: 12px; margin-bottom: 16px;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">${BRAND_NAME}</h1>
          </div>
          <p style="color: ${colors.muted}; font-size: 16px; margin: 0; font-weight: 500;">${template.subtitle}</p>
        </div>
        
        <!-- Main Content -->
        <div style="background: white; padding: 40px; border-radius: 16px; margin-bottom: 30px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #f1f5f9;">
          <h2 style="color: ${colors.text}; margin: 0 0 24px 0; text-align: center; font-size: 28px; font-weight: 700;">${template.title}</h2>
          
          <p style="color: ${colors.text}; line-height: 1.7; margin-bottom: 32px; font-size: 16px; text-align: center;">
            ${template.greeting}
          </p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${url}" 
               style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); 
                      color: white; 
                      padding: 16px 32px; 
                      text-decoration: none; 
                      border-radius: 12px; 
                      font-weight: 600;
                      font-size: 16px;
                      display: inline-block;
                      box-shadow: 0 8px 24px rgba(0, 212, 231, 0.3);
                      transition: all 0.3s ease;
                      border: none;">
              ${template.buttonText}
            </a>
          </div>
          
          <!-- Fallback Link -->
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid ${colors.primary};">
            <p style="color: ${colors.muted}; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
              ${template.linkText}
            </p>
            <p style="color: ${colors.primary}; word-break: break-all; font-size: 14px; margin: 0; font-family: monospace;">
              ${url}
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; color: ${colors.muted}; font-size: 13px; line-height: 1.6;">
          <p style="margin: 0 0 8px 0;">${template.footer1}</p>
          <p style="margin: 0;">${template.footer2}</p>
          
          <!-- Branding -->
          <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: ${colors.muted}; font-size: 12px;">
              Powered by <strong style="color: ${colors.primary};">${BRAND_NAME}</strong>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function sendVerificationEmail(
  email: string,
  token: string,
  locale: 'zh' | 'en' = 'en',
  ipAddress?: string
) {
  // 检查频率限制
  const rateLimitCheck = checkEmailRateLimit(email, 'verification', ipAddress)
  if (!rateLimitCheck.allowed) {
    const errorMessage = locale === 'zh' 
      ? '发送邮件过于频繁，请稍后再试' 
      : rateLimitCheck.error || 'Too many requests, please try again later'
    return { success: false, error: errorMessage }
  }

  const verificationUrl = `${process.env.NEXTAUTH_URL}/${locale}/auth/verify-email?token=${token}`
  const template = emailTemplates.verification[locale]
  
  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [email],
      subject: template.subject,
      html: generateEmailTemplate(verificationUrl, template),
    })

    if (error) {
      console.error('发送验证邮件失败:', error)
      return { success: false, error: error.message }
    }

    console.log(`验证邮件发送成功: ${email}`)
    return { success: true, data }
  } catch (error) {
    console.error('发送验证邮件异常:', error)
    return { success: false, error: '发送邮件失败' }
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  locale: 'zh' | 'en' = 'en',
  ipAddress?: string
) {
  // 检查频率限制
  const rateLimitCheck = checkEmailRateLimit(email, 'password_reset', ipAddress)
  if (!rateLimitCheck.allowed) {
    const errorMessage = locale === 'zh' 
      ? '发送邮件过于频繁，请稍后再试' 
      : rateLimitCheck.error || 'Too many requests, please try again later'
    return { success: false, error: errorMessage }
  }

  const resetUrl = `${process.env.NEXTAUTH_URL}/${locale}/auth/reset-password?token=${token}`
  const template = emailTemplates.passwordReset[locale]
  
  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [email],
      subject: template.subject,
      html: generateEmailTemplate(resetUrl, template),
    })

    if (error) {
      console.error('发送密码重置邮件失败:', error)
      return { success: false, error: error.message }
    }

    console.log(`密码重置邮件发送成功: ${email}`)
    return { success: true, data }
  } catch (error) {
    console.error('发送密码重置邮件异常:', error)
    return { success: false, error: '发送邮件失败' }
  }
}

// 生成通知邮件HTML模板（无按钮）
function generateNotificationEmailTemplate(
  template:
    | typeof emailTemplates.pointsPurchase.zh
    | typeof emailTemplates.subscriptionSuccess.zh
    | typeof emailTemplates.withdrawRequestAdmin.zh
    | typeof emailTemplates.withdrawStatusUser.zh,
  content: string
): string {
  const colors = BRAND_COLORS
  
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${template.subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px; padding: 20px 0;">
          <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); border-radius: 12px; margin-bottom: 16px;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">${BRAND_NAME}</h1>
          </div>
          <p style="color: ${colors.muted}; font-size: 16px; margin: 0; font-weight: 500;">${template.subtitle}</p>
        </div>
        
        <!-- Main Content -->
        <div style="background: white; padding: 40px; border-radius: 16px; margin-bottom: 30px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #f1f5f9;">
          <h2 style="color: ${colors.text}; margin: 0 0 24px 0; text-align: center; font-size: 28px; font-weight: 700;">${template.title}</h2>
          
          <p style="color: ${colors.text}; line-height: 1.7; margin-bottom: 32px; font-size: 16px; text-align: center;">
            ${template.greeting}
          </p>
          
          <div style="color: ${colors.text}; line-height: 1.7; font-size: 16px;">
            ${content}
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; color: ${colors.muted}; font-size: 13px; line-height: 1.6;">
          <p style="margin: 0 0 8px 0;">${template.footer1}</p>
          <p style="margin: 0;">${template.footer2}</p>
          
          <!-- Branding -->
          <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: ${colors.muted}; font-size: 12px;">
              Powered by <strong style="color: ${colors.primary};">${BRAND_NAME}</strong>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// 发送积分充值成功邮件
export async function sendPointsPurchaseEmail(
  email: string,
  points: number,
  amount: number,
  currency: string = 'usd',
  locale: 'zh' | 'en' = 'en'
) {
  const template = emailTemplates.pointsPurchase[locale]
  const colors = BRAND_COLORS
  
  const formattedAmount = new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
  
  const pointsText = locale === 'zh' ? `${points.toLocaleString()} 积分` : `${points.toLocaleString()} Points`
  
  const content = `
    <div style="background: linear-gradient(135deg, ${colors.primary}15 0%, ${colors.primaryDark}15 100%); padding: 24px; border-radius: 12px; margin: 32px 0; border-left: 4px solid ${colors.primary};">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <span style="color: ${colors.muted}; font-size: 14px; font-weight: 500;">${template.pointsLabel}</span>
        <span style="color: ${colors.text}; font-size: 20px; font-weight: 700;">${pointsText}</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: ${colors.muted}; font-size: 14px; font-weight: 500;">${template.amountLabel}</span>
        <span style="color: ${colors.text}; font-size: 18px; font-weight: 600;">${formattedAmount}</span>
      </div>
    </div>
    
    <p style="text-align: center; margin-top: 32px; color: ${colors.muted}; font-size: 14px;">
      ${template.successMessage}
    </p>
  `
  
  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [email],
      subject: template.subject,
      html: generateNotificationEmailTemplate(template, content),
    })

    if (error) {
      console.error('发送积分充值邮件失败:', error)
      return { success: false, error: error.message }
    }

    console.log(`积分充值邮件发送成功: ${email}`)
    return { success: true, data }
  } catch (error) {
    console.error('发送积分充值邮件异常:', error)
    return { success: false, error: '发送邮件失败' }
  }
}

// 发送管理员提现申请通知
export async function sendWithdrawRequestAdminEmail(params: {
  userName?: string | null
  userEmail: string
  amountInCents: number
  paymentMethod: string
  accountName: string
  accountInfo: string
  requestedAt: Date
  locale?: 'zh' | 'en'
}) {
  const locale: 'zh' | 'en' = params.locale || 'zh'
  const template = emailTemplates.withdrawRequestAdmin[locale]
  const colors = BRAND_COLORS

  const formattedAmount = new Intl.NumberFormat(
    locale === 'zh' ? 'zh-CN' : 'en-US',
    {
      style: 'currency',
      currency: 'USD',
    }
  ).format(params.amountInCents / 100)

  const formattedTime = new Intl.DateTimeFormat(
    locale === 'zh' ? 'zh-CN' : 'en-US',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(params.requestedAt)

  const content = `
    <div style="background: #f9fafb; padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #e5e7eb;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <span style="color: ${colors.muted}; font-size: 14px; font-weight: 500;">${template.userLabel}</span>
        <span style="color: ${colors.text}; font-size: 14px; font-weight: 600;">${params.userName || '-'}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <span style="color: ${colors.muted}; font-size: 14px; font-weight: 500;">${template.emailLabel}</span>
        <span style="color: ${colors.text}; font-size: 14px; font-weight: 600;">${params.userEmail}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <span style="color: ${colors.muted}; font-size: 14px; font-weight: 500;">${template.amountLabel}</span>
        <span style="color: ${colors.text}; font-size: 14px; font-weight: 600;">${formattedAmount}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <span style="color: ${colors.muted}; font-size: 14px; font-weight: 500;">${template.methodLabel}</span>
        <span style="color: ${colors.text}; font-size: 14px; font-weight: 600;">${params.paymentMethod}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <span style="color: ${colors.muted}; font-size: 14px; font-weight: 500;">${template.accountLabel}</span>
        <span style="color: ${colors.text}; font-size: 14px; font-weight: 600;">${params.accountName} / ${params.accountInfo}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: ${colors.muted}; font-size: 14px; font-weight: 500;">${template.timeLabel}</span>
        <span style="color: ${colors.text}; font-size: 14px; font-weight: 600;">${formattedTime}</span>
      </div>
    </div>
  `

  const adminEmail = process.env.RESEND_ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL
  if (!adminEmail) {
    console.warn('RESEND_ADMIN_EMAIL / RESEND_FROM_EMAIL not set, skip admin withdraw email')
    return { success: false, error: 'Admin email not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [adminEmail],
      subject: template.subject,
      html: generateNotificationEmailTemplate(template, content),
    })

    if (error) {
      console.error('发送管理员提现通知邮件失败:', error)
      return { success: false, error: error.message }
    }

    console.log(`管理员提现通知邮件发送成功: ${adminEmail}`)
    return { success: true, data }
  } catch (error) {
    console.error('发送管理员提现通知邮件异常:', error)
    return { success: false, error: '发送邮件失败' }
  }
}

// 发送用户提现状态通知
export async function sendWithdrawStatusEmail(params: {
  email: string
  amountInCents: number
  paymentMethod: string
  accountName: string
  accountInfo: string
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  note?: string | null
  locale?: 'zh' | 'en'
}) {
  const locale: 'zh' | 'en' = params.locale || 'zh'
  const template = emailTemplates.withdrawStatusUser[locale]
  const colors = BRAND_COLORS

  const formattedAmount = new Intl.NumberFormat(
    locale === 'zh' ? 'zh-CN' : 'en-US',
    {
      style: 'currency',
      currency: 'USD',
    }
  ).format(params.amountInCents / 100)

  const statusTextMapZh: Record<typeof params.status, string> = {
    PROCESSING: '处理中',
    COMPLETED: '已完成',
    FAILED: '失败',
    CANCELLED: '已取消',
  }

  const statusTextMapEn: Record<typeof params.status, string> = {
    PROCESSING: 'Processing',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    CANCELLED: 'Cancelled',
  }

  const statusText =
    locale === 'zh'
      ? statusTextMapZh[params.status]
      : statusTextMapEn[params.status]

  const note =
    params.note && params.note.trim().length > 0
      ? params.note.trim()
      : locale === 'zh'
      ? params.status === 'COMPLETED'
        ? '款项将很快到账，如有延迟请耐心等待。'
      : '如需更多详情，可以通过官网或应用内的支持渠道联系我们。'
      : params.status === 'COMPLETED'
      ? 'Funds should arrive shortly. Thanks for your patience.'
      : 'If you need more details, you can contact us via the help center or in‑app support.'

  const content = `
    <div style="background: #f9fafb; padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #e5e7eb;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <span style="color: ${colors.muted}; font-size: 14px; font-weight: 500;">${template.amountLabel}</span>
        <span style="color: ${colors.text}; font-size: 14px; font-weight: 600;">${formattedAmount}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <span style="color: ${colors.muted}; font-size: 14px; font-weight: 500;">${template.statusLabel}</span>
        <span style="color: ${colors.text}; font-size: 14px; font-weight: 600;">${statusText}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <span style="color: ${colors.muted}; font-size: 14px; font-weight: 500;">${template.methodLabel}</span>
        <span style="color: ${colors.text}; font-size: 14px; font-weight: 600;">${params.paymentMethod}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <span style="color: ${colors.muted}; font-size: 14px; font-weight: 500;">${template.accountLabel}</span>
        <span style="color: ${colors.text}; font-size: 14px; font-weight: 600;">${params.accountName} / ${params.accountInfo}</span>
      </div>
      <div style="margin-top: 12px;">
        <span style="color: ${colors.muted}; font-size: 14px; font-weight: 500; display: block; margin-bottom: 4px;">${template.noteLabel}</span>
        <p style="color: ${colors.text}; font-size: 14px; margin: 0;">${note}</p>
      </div>
    </div>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [params.email],
      subject: template.subject,
      html: generateNotificationEmailTemplate(template, content),
    })

    if (error) {
      console.error('发送提现状态通知邮件失败:', error)
      return { success: false, error: error.message }
    }

    console.log(`提现状态通知邮件发送成功: ${params.email}`)
    return { success: true, data }
  } catch (error) {
    console.error('发送提现状态通知邮件异常:', error)
    return { success: false, error: '发送邮件失败' }
  }
}

// 获取计划显示名称
function getPlanDisplayName(plan: string, lang: 'zh' | 'en'): string {
  const planMap: Record<string, { zh: string; en: string }> = {
    trial: { zh: '试用版', en: 'Trial' },
    pro: { zh: '专业版', en: 'Professional' },
    annual: { zh: '年度版', en: 'Annual' },
    enterprise: { zh: '企业版', en: 'Enterprise' },
  }
  return planMap[plan]?.[lang] || plan
}

// 发送订阅购买成功邮件
export async function sendSubscriptionSuccessEmail(
  email: string,
  planName: string,
  planType: string,
  periodEnd: Date,
  amount: number,
  currency: string = 'usd',
  locale: 'zh' | 'en' = 'en'
) {
  const template = emailTemplates.subscriptionSuccess[locale]
  const colors = BRAND_COLORS
  
  const formattedAmount = new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
  
  const formattedDate = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(periodEnd)
  
  // 根据 locale 获取正确语言的计划名称，忽略传入的 planName（可能包含中文）
  const displayPlanName = getPlanDisplayName(planType, locale)
  
  const content = `
    <div style="background: linear-gradient(135deg, ${colors.primary}15 0%, ${colors.primaryDark}15 100%); padding: 24px; border-radius: 12px; margin: 32px 0; border-left: 4px solid ${colors.primary};">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <span style="color: ${colors.muted}; font-size: 14px; font-weight: 500;">${template.planLabel}</span>
        <span style="color: ${colors.text}; font-size: 18px; font-weight: 700;">${displayPlanName}</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <span style="color: ${colors.muted}; font-size: 14px; font-weight: 500;">${template.expiresLabel}</span>
        <span style="color: ${colors.text}; font-size: 16px; font-weight: 600;">${formattedDate}</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: ${colors.muted}; font-size: 14px; font-weight: 500;">${template.amountLabel}</span>
        <span style="color: ${colors.text}; font-size: 18px; font-weight: 600;">${formattedAmount}</span>
      </div>
    </div>
    
    <p style="text-align: center; margin-top: 32px; color: ${colors.muted}; font-size: 14px;">
      ${template.successMessage}
    </p>
  `
  
  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [email],
      subject: template.subject,
      html: generateNotificationEmailTemplate(template, content),
    })

    if (error) {
      console.error('发送订阅成功邮件失败:', error)
      return { success: false, error: error.message }
    }

    console.log(`订阅成功邮件发送成功: ${email}`)
    return { success: true, data }
  } catch (error) {
    console.error('发送订阅成功邮件异常:', error)
    return { success: false, error: '发送邮件失败' }
  }
} 