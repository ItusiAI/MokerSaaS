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
  primary: '#D97706',
  primaryDark: '#EA580C',
  primaryLight: '#FEF3C7',
  background: '#F9FAFB',
  backgroundDark: '#181c24',
  text: '#111827',
  muted: '#6B7280',
  accent: '#059669',
  accentLight: '#D1FAE5'
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

// 支持的邮件语言
export type EmailLocale = 'en' | 'zh' | 'ja' | 'ko' | 'tw'

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
    ja: {
      subject: `ようこそ ${BRAND_NAME} – メールアドレスをご確認ください`,
      title: 'メールアドレスの確認',
      subtitle: `${BRAND_NAME} はグローバル製品づくりのお手伝いをします`,
      greeting: `ようこそ！下のボタンをクリックしてメール認証を完了すると、${BRAND_NAME} のすべての機能をご利用いただけます。`,
      buttonText: 'メールアドレスを認証する',
      linkText: 'ボタンがクリックできない場合は、以下のリンクをブラウザにコピー＆ペーストしてください：',
      footer1: 'これは一度きりの認証メールです。直接返信しないでください。',
      footer2: `ご不明な点がございましたら、公式サイトまたはアプリ内サポートより ${BRAND_NAME} チームまでお問い合わせください。`
    },
    ko: {
      subject: `${BRAND_NAME}에 오신 것을 환영합니다 – 이메일 주소를 확인해 주세요`,
      title: '이메일 주소 확인',
      subtitle: `${BRAND_NAME}가 글로벌 제품 구축을 도와드립니다`,
      greeting: `안녕하세요! 아래 버튼을 클릭하여 이메일 인증을 완료하시면 ${BRAND_NAME}의 모든 기능을 이용하실 수 있습니다.`,
      buttonText: '이메일 인증하기',
      linkText: '버튼이 작동하지 않으면 아래 링크를 브라우저에 복사하여 붙여넣으세요:',
      footer1: '일회용 인증 메일이므로 직접 회신하지 마세요.',
      footer2: `도움이 필요하시면 공식 사이트 또는 앱 내 지원 채널을 통해 ${BRAND_NAME} 팀에 문의해 주세요.`
    },
    tw: {
      subject: `歡迎加入 ${BRAND_NAME} - 請驗證郵箱`,
      title: '確認您的郵箱',
      subtitle: `${BRAND_NAME} 想和你一起打造全球化產品`,
      greeting: `你好！只需點擊下方按鈕即可完成郵箱驗證，我們已經迫不及待想讓你體驗 ${BRAND_NAME} 的全部功能了。`,
      buttonText: '立即驗證郵箱',
      linkText: '如果按鈕無法點擊，請複製以下鏈接到瀏覽器：',
      footer1: '這是一次性驗證郵件，請勿直接回復。',
      footer2: `如需幫助，可以通過官網或應用內的支持渠道聯繫 ${BRAND_NAME} 團隊。`
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
    ja: {
      subject: `${BRAND_NAME} のパスワードを再設定`,
      title: 'アクセス権限の回復をお手伝いします',
      subtitle: 'ご心配なく。数ステップでパスワードを再設定できます',
      greeting: `パスワード再設定のリクエストを受け付けました。下のボタンをクリックして新しいパスワードを設定してください。お心当たりがない場合は、本メールを無視していただいて結構です。`,
      buttonText: 'パスワードを再設定',
      linkText: 'ボタンがクリックできない場合は、以下のリンクをブラウザにコピー＆ペーストしてください：',
      footer1: `${BRAND_NAME} からのご案内：パスワードは安全に保管し、他人と共有しないでください。`,
      footer2: 'さらなるサポートが必要な場合は、公式サイトまたはアプリ内サポートよりお問い合わせください。'
    },
    ko: {
      subject: `${BRAND_NAME} 비밀번호 재설정`,
      title: '접근 권한 복구를 도와드립니다',
      subtitle: '걱정하지 마세요. 몇 단계면 비밀번호를 재설정할 수 있습니다',
      greeting: `비밀번호 재설정 요청을 접수했습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정하세요. 본인이 요청하지 않은 경우 이 메일을 무시하셔도 됩니다.`,
      buttonText: '비밀번호 재설정',
      linkText: '버튼이 작동하지 않으면 아래 링크를 브라우저에 복사하여 붙여넣으세요:',
      footer1: `${BRAND_NAME}의 안내: 비밀번호는 안전하게 보관하고 다른 사람과 공유하지 마세요.`,
      footer2: '추가 지원이 필요하시면 공식 사이트 또는 앱 내 지원 채널로 문의해 주세요.'
    },
    tw: {
      subject: `重設 ${BRAND_NAME} 密碼`,
      title: '我們在這裡幫你找回訪問權限',
      subtitle: '別擔心，幾步內即可完成密碼重設',
      greeting: `您提出了密碼重置請求，點擊下方按鈕就能設置一個全新的密碼。若不是您本人操作，可放心忽略此郵件。`,
      buttonText: '重置密碼',
      linkText: '如果按鈕無法點擊，請複製以下鏈接到瀏覽器：',
      footer1: `來自 ${BRAND_NAME} 的溫馨提醒：確保密碼安全，別與他人共享。`,
      footer2: '如果需要進一步幫助，可以通過官網或應用內的支持渠道聯繫我們。'
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
    ja: {
      subject: `ポイントが入金されました – ${BRAND_NAME} をご利用いただきありがとうございます`,
      title: 'ポイント購入が完了しました',
      subtitle: `${BRAND_NAME} のポイントでさらなる創造力を発揮しましょう`,
      greeting: 'ポイントが無事アカウントに追加されました。新しい機能を探求する際にご自由にお使いください。',
      footer1: 'ご利用くださいましてありがとうございます。サポートが必要な場合はいつでもご連絡ください。',
      footer2: `– ${BRAND_NAME} チーム`,
      pointsLabel: 'チャージしたポイント',
      amountLabel: '支払金額',
      successMessage: 'ポイントが入金されました。創作活動と楽しさをお届けします。'
    },
    ko: {
      subject: `포인트가 충전되었습니다 – ${BRAND_NAME}을 이용해주셔서 감사합니다`,
      title: '포인트 구매 완료',
      subtitle: `${BRAND_NAME} 포인트로 더 많은 창의력을 발휘하세요`,
      greeting: '포인트가 안전하게 계정에 추가되었습니다. 새로운 기능을 탐색할 때 언제든지 사용하실 수 있습니다.',
      footer1: '즐겁게 사용하시고, 도움이 필요하시면 언제든지 알려주세요.',
      footer2: `– ${BRAND_NAME} 팀`,
      pointsLabel: '충전한 포인트',
      amountLabel: '결제 금액',
      successMessage: '포인트가 충전되었습니다. 즐겁게 창작하세요.'
    },
    tw: {
      subject: `積分已到賬 - 感謝支持 ${BRAND_NAME}`,
      title: '積分充值成功',
      subtitle: `讓 ${BRAND_NAME} 的積分助你發揮更多創意`,
      greeting: '積分已經安全添加到你的賬戶，隨時都可以用來探索新的功能。',
      footer1: '祝你使用愉快，如需幫助我們一直都在。',
      footer2: `– ${BRAND_NAME} 團隊`,
      pointsLabel: '充值積分',
      amountLabel: '支付金額',
      successMessage: '積分已經到賬，祝你玩得開心，創意不斷。'
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
    ja: {
      subject: `ご購読ありがとうございます – ${BRAND_NAME} と共に成長を続けましょう`,
      title: 'サブスクリプションが有効化されました',
      subtitle: '引き続き、共に新たな可能性を探求していきましょう',
      greeting: 'サブスクリプションが有効になりました！以下がご購読の詳細です。より良い体験を引き続き提供してまいります。',
      footer1: 'ご信頼いただきありがとうございます。引き続き努力してまいります。',
      footer2: `– ${BRAND_NAME} チーム`,
      planLabel: '購読プラン',
      expiresLabel: '有効期限',
      amountLabel: '支払金額',
      successMessage: 'サブスクリプションが有効化されました。すべてのプレミアム機能をご利用いただけます。'
    },
    ko: {
      subject: `구독이 완료되었습니다 – ${BRAND_NAME}과 함께 성장해 나가요`,
      title: '구독이 활성화되었습니다',
      subtitle: '앞으로도 함께 새로운 가능성을 탐색해 나가요',
      greeting: '구독이 시작되었습니다! 아래는 구독 상세 내용이며, 더 나은 경험을 지속적으로 제공하겠습니다.',
      footer1: '신뢰해 주셔서 감사합니다. 계속 노력하겠습니다.',
      footer2: `– ${BRAND_NAME} 팀`,
      planLabel: '구독 플랜',
      expiresLabel: '만료일',
      amountLabel: '결제 금액',
      successMessage: '구독이 활성화되었습니다. 모든 프리미엄 기능을 이용하실 수 있습니다.'
    },
    tw: {
      subject: `訂閱成功 - ${BRAND_NAME} 陪你長期成長`,
      title: '訂閱已經激活',
      subtitle: '歡迎繼續和我們一起探索更多可能',
      greeting: '訂閱生效啦！下面是你的訂閱詳情，我們會持續為你提供更好的體驗。',
      footer1: '感謝信任，我們會繼續加油。',
      footer2: `– ${BRAND_NAME} 團隊`,
      planLabel: '訂閱版本',
      expiresLabel: '到期時間',
      amountLabel: '支付金額',
      successMessage: '訂閱已激活，所有高級功能已經為你開放。'
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
    ja: {
      subject: `新しい出金申請の承認待ち – ${BRAND_NAME}`,
      title: '新しい出金申請',
      subtitle: 'アフィリエイトユーザーから新しい出金申請が行われました。バックグラウンドで速やかに処理してください',
      greeting: 'システムで以下の出金申請を受領しました。バックグラウンド「アフィリエイト管理 - 出金管理」にログインして詳細を確認し、承認／振込を行ってください。',
      footer1: 'このメールは管理者への通知専用です。他ユーザーに転送しないでください。',
      footer2: `– ${BRAND_NAME} システム通知`,
      userLabel: '申請ユーザー',
      emailLabel: 'ユーザーメール',
      amountLabel: '出金額',
      methodLabel: '受取方法',
      accountLabel: '受取口座',
      timeLabel: '申請時間'
    },
    ko: {
      subject: `새로운 출금 신청 승인 대기 – ${BRAND_NAME}`,
      title: '새로운 출금 신청',
      subtitle: '제휴 사용자가 새로운 출금 신청을 제출했습니다. 백오피스에서 신속히 처리해 주세요',
      greeting: '시스템에서 아래 출금 신청을 접수했습니다. 백오피스 「제휴 관리 - 출금 관리」에 로그인하여 자세한 내용을 확인하고 승인/송금을 완료해 주세요.',
      footer1: '본 메일은 관리자 알림 전용이므로 다른 사용자에게 전달하지 마세요.',
      footer2: `– ${BRAND_NAME} 시스템 알림`,
      userLabel: '신청 사용자',
      emailLabel: '사용자 이메일',
      amountLabel: '출금액',
      methodLabel: '수령 방법',
      accountLabel: '수령 계좌',
      timeLabel: '신청 시간'
    },
    tw: {
      subject: `有新的提現申請待審核 - ${BRAND_NAME}`,
      title: '新的提現申請',
      subtitle: '有推廣用戶發起了新的提現申請，請儘快在後臺處理',
      greeting: '我們在系統中收到了以下提現申請，請登錄後臺「推廣管理 - 提現管理」查看詳情並完成審核/打款。',
      footer1: '本郵件僅用於通知管理員，請勿轉發給其他用戶。',
      footer2: `– ${BRAND_NAME} 系統通知`,
      userLabel: '申請用戶',
      emailLabel: '用戶郵箱',
      amountLabel: '提現金額',
      methodLabel: '收款方式',
      accountLabel: '收款賬戶',
      timeLabel: '申請時間'
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
    ja: {
      subject: `出金申請のステータス更新 – ${BRAND_NAME}`,
      title: '出金審査の進捗更新',
      subtitle: '出金申請に最新の進展がありました',
      greeting: 'このたび出金申請の処理結果を更新しました。以下が今回の出金の最新ステータスと重要な情報です。',
      footer1: 'お待ちいただきましてありがとうございます。当社は出金体験の改善を継続してまいります。',
      footer2: `– ${BRAND_NAME} チーム`,
      amountLabel: '出金額',
      statusLabel: '現在のステータス',
      methodLabel: '受取方法',
      accountLabel: '受取口座',
      noteLabel: '備考'
    },
    ko: {
      subject: `출금 신청 상태 업데이트 – ${BRAND_NAME}`,
      title: '출금 심사 진행 업데이트',
      subtitle: '출금 신청에 새로운進展이 있습니다',
      greeting: '이번 출금 신청의 처리 결과를 업데이트했습니다. 아래는 이번 출금의 최신 상태와 주요 정보입니다.',
      footer1: '기다려 주셔서 감사합니다. 당사는 출금 경험을 지속적으로 개선해 나가겠습니다.',
      footer2: `– ${BRAND_NAME} 팀`,
      amountLabel: '출금액',
      statusLabel: '현재 상태',
      methodLabel: '수령 방법',
      accountLabel: '수령 계좌',
      noteLabel: '비고'
    },
    tw: {
      subject: `提現申請狀態更新 - ${BRAND_NAME}`,
      title: '提現審核進度更新',
      subtitle: '你的提現申請有了最新進展',
      greeting: '我們已經更新了本次提現申請的處理結果，下面是本次提現的最新狀態和關鍵信息。',
      footer1: '感謝你的耐心等待，我們會持續優化提現體驗。',
      footer2: `– ${BRAND_NAME} 團隊`,
      amountLabel: '提現金額',
      statusLabel: '當前狀態',
      methodLabel: '收款方式',
      accountLabel: '收款賬戶',
      noteLabel: '備註說明'
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
                      box-shadow: 0 8px 24px rgba(217, 119, 6, 0.3);
                      transition: all 0.3s ease;
                      border: none;">
              ${template.buttonText}
            </a>
          </div>
          
          <!-- Fallback Link -->
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid ${colors.primary};">
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
  locale: EmailLocale = 'en',
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
  locale: EmailLocale = 'en',
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
  locale: EmailLocale = 'en'
) {
  const template = emailTemplates.pointsPurchase[locale]
  const colors = BRAND_COLORS
  
  const formattedAmount = new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
  
  const pointsText = locale === 'zh' ? `${points.toLocaleString()} 积分` : `${points.toLocaleString()} Points`
  
  const content = `
    <div style="background: linear-gradient(135deg, ${colors.primaryLight} 0%, white 100%); padding: 24px; border-radius: 12px; margin: 32px 0; border-left: 4px solid ${colors.primary};">
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
  locale?: EmailLocale
}) {
  const locale: EmailLocale = params.locale || 'zh'
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
  locale?: EmailLocale
}) {
  const locale: EmailLocale = params.locale || 'zh'
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
function getPlanDisplayName(plan: string, lang: EmailLocale): string {
  const planMap: Record<string, Record<EmailLocale, string>> = {
    trial:     { zh: '试用版',  tw: '試用版',  en: 'Trial',         ja: 'トライアル',     ko: 'Trial' },
    pro:       { zh: '专业版',  tw: '專業版',  en: 'Professional',  ja: 'プロフェッショナル', ko: 'Professional' },
    annual:    { zh: '年度版',  tw: '年度版',  en: 'Annual',        ja: '年間',             ko: 'Annual' },
    enterprise:{ zh: '企业版',  tw: '企業版',  en: 'Enterprise',    ja: 'エンタープライズ', ko: 'Enterprise' },
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
  locale: EmailLocale = 'en'
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
    <div style="background: linear-gradient(135deg, ${colors.primaryLight} 0%, white 100%); padding: 24px; border-radius: 12px; margin: 32px 0; border-left: 4px solid ${colors.primary};">
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

// ============================================================
// ============ 订阅到期提醒邮件 (cron 自动发送) =============
// ============================================================

import type { ReminderType } from '@/lib/subscription'

// 订阅提醒专用 sender(独立于 RESEND_FROM_EMAIL)
// 如果未配置,fallback 到通用 sender,保证至少能发送
const getSubscriptionFromAddress = () => {
  const sub = process.env.RESEND_SUBSCRIPTION_FROM_EMAIL
  if (sub) return sub
  return getFromAddress()
}

// 计划显示名(5 语言)
const PLAN_DISPLAY_NAMES: Record<string, Record<EmailLocale, string>> = {
  trial:     { zh: '试用版',     tw: '試用版',     en: 'Trial',         ja: 'トライアル',     ko: 'Trial' },
  pro:       { zh: '专业版',     tw: '專業版',     en: 'Professional',  ja: 'プロフェッショナル', ko: 'Professional' },
  annual:    { zh: '年度版',     tw: '年度版',     en: 'Annual',        ja: '年間',             ko: 'Annual' },
  enterprise:{ zh: '企业版',     tw: '企業版',     en: 'Enterprise',    ja: 'エンタープライズ', ko: 'Enterprise' },
}

function getReminderPlanDisplayName(plan: string, locale: EmailLocale): string {
  return PLAN_DISPLAY_NAMES[plan]?.[locale] ?? plan
}

// 5 语言邮件内容(7d / 3d / today 各一套)
const reminderCopy = {
  '7d': {
    zh: {
      subject: '您的订阅将在 7 天后到期',
      preview: '您的订阅将在 7 天后到期,请考虑续订以保持服务不中断。',
      heading: '订阅即将到期',
      greeting: (name: string) => `${name},您好:`,
      body1: '感谢您使用 MokerSaaS。为避免您的服务中断,请考虑在到期前续订。',
      body2: '当前订阅计划:',
      body3: '您可访问下方页面查看续订方案并完成续订,服务将在到期后自动顺延。',
      cta: '前往续订',
      footer1: '本邮件由 MokerSaaS 自动发送,仅与您的订阅状态相关。',
      footer2: '如果您不再希望收到此类提醒,可以随时取消订阅提醒。',
      footer3: '取消订阅提醒',
      importantNote: '重要提示:订阅到期后,系统将自动清零本次订阅赠送的积分,您购买/充值的积分不受影响。',
    },
    en: {
      subject: 'Your subscription expires in 7 days',
      preview: 'Your subscription expires in 7 days. Renew to keep your service uninterrupted.',
      heading: 'Subscription Expiring Soon',
      greeting: (name: string) => `Hi ${name},`,
      body1: 'Thanks for using MokerSaaS. To avoid any service interruption, please renew before it expires.',
      body2: 'Current plan:',
      body3: 'Visit the page below to review renewal options and complete your subscription. Service continues automatically once renewed.',
      cta: 'Renew Now',
      footer1: 'This is an automated message from MokerSaaS regarding your subscription.',
      footer2: 'You can opt out of these reminders at any time.',
      footer3: 'Unsubscribe from reminders',
      importantNote: 'Important: when your subscription expires, gifted credits will be cleared. Purchased/top-up credits are not affected.',
    },
    ja: {
      subject: 'サブスクリプションは7日後に到期します',
      preview: 'サブスクリプションは7日後に到期します。サービス継続のため更新をご検討ください。',
      heading: 'サブスクリプション即将到期',
      greeting: (name: string) => `${name} 様`,
      body1: 'MokerSaaSをご利用いただきありがとうございます。サービス中断を避けるため、有効期限前に更新をご検討ください。',
      body2: '現在の購読プラン:',
      body3: '下記のページから更新プランを確認し、更新手続きを行ってください。',
      cta: '更新へ',
      footer1: '本メールはサブスクリプション状態に関する自動通知です。',
      footer2: '此类提醒をご希望でない場合は、随时取消できます。',
      footer3: 'リマインダーを解除',
      importantNote: '重要:サブスクリプション到期後、赠送ポイントは自動的にクリアされます。購入/チャージポイントは影響を受けません。',
    },
    ko: {
      subject: '구독이 7일 후 만료됩니다',
      preview: '구독이 7일 후 만료됩니다. 서비스 연속을 위해 갱신을 고려해 주세요.',
      heading: '구독이 곧 만료됩니다',
      greeting: (name: string) => `${name} 님, 안녕하세요.`,
      body1: 'MokerSaaS를 이용해 주셔서 감사합니다. 서비스 중단을 피하시려면 만료 전에 갱신해 주세요.',
      body2: '현재 구독 플랜:',
      body3: '아래 페이지에서 갱신 옵션을 확인하고 구독을 이어가세요.',
      cta: '갱신하러 가기',
      footer1: '본 메일은 구독 상태에 관한 자동 알림입니다.',
      footer2: '此类 알림을 더 이상 원치 않으시면 随时 해지할 수 있습니다.',
      footer3: '알림 해지',
      importantNote: '중요: 구독 만료 시赠送 포인트는 자동으로 소멸됩니다. 구매/충전 포인트는 영향을 받지 않습니다.',
    },
    tw: {
      subject: '您的訂閱將在 7 天後到期',
      preview: '您的訂閱將在 7 天後到期,請考慮續訂以保持服務不中斷。',
      heading: '訂閱即將到期',
      greeting: (name: string) => `${name},您好:`,
      body1: '感謝您使用 MokerSaaS。為避免您的服務中斷,請考慮在到期前續訂。',
      body2: '當前訂閱計劃:',
      body3: '請前往下方頁面查看續訂方案並完成續訂,服務將在到期後自動順延。',
      cta: '前往續訂',
      footer1: '本郵件由 MokerSaaS 自動發送,僅與您的訂閱狀態相關。',
      footer2: '如果您不再希望收到此類提醒,可以隨時取消訂閱提醒。',
      footer3: '取消訂閱提醒',
      importantNote: '重要提示:訂閱到期後,系統將自動清零本次訂閱贈送的積分,您購買/充值的積分不受影響。',
    },
  },
  '3d': {
    zh: {
      subject: '您的订阅将在 3 天后到期',
      preview: '您的订阅将在 3 天后到期,请尽快续订。',
      heading: '订阅即将到期',
      greeting: (name: string) => `${name},您好:`,
      body1: '再过 3 天您的订阅即将到期。为了不间断使用 MokerSaaS 的全部功能,请尽快续订。',
      body2: '当前订阅计划:',
      body3: '点击下方按钮查看续订方案并立即续订。',
      cta: '立即续订',
      footer1: '本邮件由 MokerSaaS 自动发送,仅与您的订阅状态相关。',
      footer2: '如果您不再希望收到此类提醒,可以随时取消订阅提醒。',
      footer3: '取消订阅提醒',
      importantNote: '重要提示:订阅到期后,系统将自动清零本次订阅赠送的积分,您购买/充值的积分不受影响。',
    },
    en: {
      subject: 'Your subscription expires in 3 days',
      preview: 'Your subscription expires in 3 days. Renew now to keep your access.',
      heading: 'Subscription Expiring in 3 Days',
      greeting: (name: string) => `Hi ${name},`,
      body1: 'Your subscription will end in 3 days. To keep using all MokerSaaS features without interruption, please renew now.',
      body2: 'Current plan:',
      body3: 'Tap the button below to review renewal options and continue your subscription.',
      cta: 'Renew Now',
      footer1: 'This is an automated message from MokerSaaS regarding your subscription.',
      footer2: 'You can opt out of these reminders at any time.',
      footer3: 'Unsubscribe from reminders',
      importantNote: 'Important: when your subscription expires, gifted credits will be cleared. Purchased/top-up credits are not affected.',
    },
    ja: {
      subject: 'サブスクリプションは3日後に到期します',
      preview: 'サブスクリプションは3日後に到期します。サービス継続のため今すぐご更新ください。',
      heading: 'サブスクリプションまで3日',
      greeting: (name: string) => `${name} 様`,
      body1: 'あと3日でサブスクリプションが到期します。MokerSaaSの全機能を中断なくご利用いただくため、今すぐ更新してください。',
      body2: '現在の購読プラン:',
      body3: '下記のボタンから更新プランを確認し、即時更新手続きを行ってください。',
      cta: '今すぐ更新',
      footer1: '本メールはサブスクリプション状態に関する自動通知です。',
      footer2: '此类提醒をご希望でない場合は、随时取消できます。',
      footer3: 'リマインダーを解除',
      importantNote: '重要:サブスクリプション到期後、赠送ポイントは自動的にクリアされます。購入/チャージポイントは影響を受けません。',
    },
    ko: {
      subject: '구독이 3일 후 만료됩니다',
      preview: '구독이 3일 후 만료됩니다. 지금 갱신해 주세요.',
      heading: '구독이 3일 남았습니다',
      greeting: (name: string) => `${name} 님, 안녕하세요.`,
      body1: '3일 후 구독이 만료됩니다. MokerSaaS의 모든 기능을 중단 없이 이용하시려면 지금 갱신해 주세요.',
      body2: '현재 구독 플랜:',
      body3: '아래 버튼을 눌러 갱신 옵션을 확인하고 즉시 구독을 이어가세요.',
      cta: '지금 갱신',
      footer1: '본 메일은 구독 상태에 관한 자동 알림입니다.',
      footer2: '此类 알림을 더 이상 원치 않으시면 随时 해지할 수 있습니다.',
      footer3: '알림 해지',
      importantNote: '중요: 구독 만료 시赠送 포인트는 자동으로 소멸됩니다. 구매/충전 포인트는 영향을 받지 않습니다.',
    },
    tw: {
      subject: '您的訂閱將在 3 天後到期',
      preview: '您的訂閱將在 3 天後到期,請儘快續訂。',
      heading: '訂閱即將到期',
      greeting: (name: string) => `${name},您好:`,
      body1: '再過 3 天您的訂閱即將到期。為了不中斷使用 MokerSaaS 的全部功能,請儘快續訂。',
      body2: '當前訂閱計劃:',
      body3: '點擊下方按鈕查看續訂方案並立即續訂。',
      cta: '立即續訂',
      footer1: '本郵件由 MokerSaaS 自動發送,僅與您的訂閱狀態相關。',
      footer2: '如果您不再希望收到此類提醒,可以隨時取消訂閱提醒。',
      footer3: '取消訂閱提醒',
      importantNote: '重要提示:訂閱到期後,系統將自動清零本次訂閱贈送的積分,您購買/充值的積分不受影響。',
    },
  },
  'today': {
    zh: {
      subject: '您的订阅今天到期',
      preview: '您的订阅今天到期,请尽快续订以保持服务不中断。',
      heading: '订阅今天到期',
      greeting: (name: string) => `${name},您好:`,
      body1: '您的订阅将在今天到期。续订后将自动顺延,无需重新设置。',
      body2: '当前订阅计划:',
      body3: '点击下方按钮立即续订,保持服务不中断。',
      cta: '立即续订',
      footer1: '本邮件由 MokerSaaS 自动发送,仅与您的订阅状态相关。',
      footer2: '如果您不再希望收到此类提醒,可以随时取消订阅提醒。',
      footer3: '取消订阅提醒',
      importantNote: '重要提示:订阅到期后,系统将自动清零本次订阅赠送的积分,您购买/充值的积分不受影响。',
    },
    en: {
      subject: 'Your subscription expires today',
      preview: 'Your subscription expires today. Renew now to keep your access.',
      heading: 'Subscription Expires Today',
      greeting: (name: string) => `Hi ${name},`,
      body1: 'Your subscription ends today. Renew now and it will continue seamlessly without any extra setup.',
      body2: 'Current plan:',
      body3: 'Tap the button below to renew and keep your service active.',
      cta: 'Renew Now',
      footer1: 'This is an automated message from MokerSaaS regarding your subscription.',
      footer2: 'You can opt out of these reminders at any time.',
      footer3: 'Unsubscribe from reminders',
      importantNote: 'Important: when your subscription expires, gifted credits will be cleared. Purchased/top-up credits are not affected.',
    },
    ja: {
      subject: 'サブスクリプションは本日到期します',
      preview: 'サブスクリプションは本日到期します。今すぐご更新ください。',
      heading: '本日サブスクリプション到期',
      greeting: (name: string) => `${name} 様`,
      body1: '本日サブスクリプションが到期します。今すぐ更新すれば、手続き不要でそのまま継続できます。',
      body2: '現在の購読プラン:',
      body3: '下記のボタンから今すぐ更新し、サービス継続にお進みください。',
      cta: '今すぐ更新',
      footer1: '本メールはサブスクリプション状態に関する自動通知です。',
      footer2: '此类提醒をご希望でない場合は、随时取消できます。',
      footer3: 'リマインダーを解除',
      importantNote: '重要:サブスクリプション到期後、赠送ポイントは自動的にクリアされます。購入/チャージポイントは影響を受けません。',
    },
    ko: {
      subject: '구독이 오늘 만료됩니다',
      preview: '구독이 오늘 만료됩니다. 지금 갱신해 주세요.',
      heading: '구독이 오늘 만료됩니다',
      greeting: (name: string) => `${name} 님, 안녕하세요.`,
      body1: '구독이 오늘 만료됩니다. 지금 갱신하시면 별도 설정 없이 바로 이어서 이용하실 수 있습니다.',
      body2: '현재 구독 플랜:',
      body3: '아래 버튼을 눌러 지금 갱신하고 서비스를 이어가세요.',
      cta: '지금 갱신',
      footer1: '본 메일은 구독 상태에 관한 자동 알림입니다.',
      footer2: '此类 알림을 더 이상 원치 않으시면 随时 해지할 수 있습니다.',
      footer3: '알림 해지',
      importantNote: '중요: 구독 만료 시赠送 포인트는 자동으로 소멸됩니다. 구매/충전 포인트는 영향을 받지 않습니다.',
    },
    tw: {
      subject: '您的訂閱今天到期',
      preview: '您的訂閱今天到期,請儘快續訂以保持服務不中斷。',
      heading: '訂閱今天到期',
      greeting: (name: string) => `${name},您好:`,
      body1: '您的訂閱將在今天到期。續訂後將自動順延,無需重新設定。',
      body2: '當前訂閱計劃:',
      body3: '點擊下方按鈕立即續訂,保持服務不中斷。',
      cta: '立即續訂',
      footer1: '本郵件由 MokerSaaS 自動發送,僅與您的訂閱狀態相關。',
      footer2: '如果您不再希望收到此類提醒,可以隨時取消訂閱提醒。',
      footer3: '取消訂閱提醒',
      importantNote: '重要提示:訂閱到期後,系統將自動清零本次訂閱贈送的積分,您購買/充值的積分不受影響。',
    },
  },
} as const

interface ReminderCopy {
  subject: string
  preview: string
  heading: string
  greeting: (name: string) => string
  body1: string
  body2: string
  body3: string
  cta: string
  footer1: string
  footer2: string
  footer3: string
  importantNote: string
}

/**
 * 生成订阅提醒邮件 HTML 模板(纯字符串,不用 react-email)
 */
function generateReminderEmailHTML(
  copy: ReminderCopy,
  planName: string,
  userName: string | null | undefined,
  renewUrl: string,
  unsubscribeUrl: string,
): string {
  const colors = BRAND_COLORS
  const safeName = (userName || '').trim() || '用户'
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${copy.subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px; padding: 20px 0;">
          <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); border-radius: 12px; margin-bottom: 16px;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">${BRAND_NAME}</h1>
          </div>
          <p style="color: ${colors.muted}; font-size: 14px; margin: 8px 0 0 0;">${copy.preview}</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 40px; border-radius: 16px; margin-bottom: 30px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #f1f5f9;">
          <h2 style="color: ${colors.text}; margin: 0 0 24px 0; text-align: center; font-size: 26px; font-weight: 700;">${copy.heading}</h2>

          <p style="color: ${colors.text}; line-height: 1.7; margin-bottom: 16px; font-size: 16px;">${copy.greeting(safeName)}</p>
          <p style="color: ${colors.text}; line-height: 1.7; margin-bottom: 16px; font-size: 16px;">${copy.body1}</p>

          <div style="background: linear-gradient(135deg, ${colors.primaryLight} 0%, white 100%); padding: 20px 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid ${colors.primary};">
            <span style="color: ${colors.muted}; font-size: 14px; font-weight: 500;">${copy.body2}</span>
            <div style="color: ${colors.text}; font-size: 20px; font-weight: 700; margin-top: 4px;">${planName}</div>
          </div>

          <p style="color: ${colors.text}; line-height: 1.7; margin: 16px 0 24px; font-size: 16px;">${copy.body3}</p>

          <p style="color: ${colors.accent}; line-height: 1.6; margin: 24px 0; font-size: 14px; background: ${colors.accentLight}; padding: 12px 16px; border-radius: 8px;">
            ${copy.importantNote}
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${renewUrl}" style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 8px 24px rgba(217, 119, 6, 0.3);">
              ${copy.cta}
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; color: ${colors.muted}; font-size: 13px; line-height: 1.6;">
          <p style="margin: 0 0 8px 0;">${copy.footer1}</p>
          <p style="margin: 0 0 16px 0;">
            <a href="${unsubscribeUrl}" style="color: ${colors.muted}; text-decoration: underline;">${copy.footer2} ${copy.footer3}</a>
          </p>
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px;">
              Powered by <strong style="color: ${colors.primary};">${BRAND_NAME}</strong>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function sendSubscriptionReminder(params: {
  to: string
  name?: string | null
  plan: string
  type: ReminderType
  locale?: string | null
  unsubscribeUrl: string
  renewUrl: string
}): Promise<{ success: boolean; messageId?: string; subject?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY 未配置,跳过订阅提醒发送')
    return { success: false, error: 'api_key_not_configured' }
  }
  if (!params.to) {
    return { success: false, error: 'no_recipient' }
  }

  // 安全回退到默认 locale
  const locale: EmailLocale = (
    ['en', 'zh', 'ja', 'ko', 'tw'].includes(params.locale ?? '')
      ? (params.locale as EmailLocale)
      : 'en'
  )

  const copy = reminderCopy[params.type][locale]
  const planName = getReminderPlanDisplayName(params.plan, locale)
  const html = generateReminderEmailHTML(
    copy,
    planName,
    params.name,
    params.renewUrl,
    params.unsubscribeUrl,
  )

  try {
    const { data, error } = await resend.emails.send({
      from: getSubscriptionFromAddress(),
      to: [params.to],
      subject: copy.subject,
      html,
      headers: {
        'List-Unsubscribe': `<${params.unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })

    if (error) {
      console.error(`[email] 订阅提醒(${params.type})发送失败:`, error)
      return { success: false, error: error.message }
    }

    console.log(`[email] 订阅提醒(${params.type})发送成功: ${params.to} (messageId=${data?.id})`)
    return { success: true, messageId: data?.id, subject: copy.subject }
  } catch (err) {
    console.error(`[email] 订阅提醒(${params.type})异常:`, err)
    return { success: false, error: 'send_exception' }
  }
}

// ============================================================
// ============ 沉睡用户召回邮件系统 ===========================
// ============================================================

export type ReengagementBucket = 'warm' | 'dormant' | 'inactive' | 'churned' | 'sleeping_paid'

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
  headers?: Record<string, string>
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [params.to],
      subject: params.subject,
      html: params.html,
      headers: params.headers,
    })
    if (error) {
      return { success: false as const, error: error.message }
    }
    return { success: true as const, messageId: data?.id }
  } catch (err) {
    console.error('[email] sendEmail error:', err)
    return { success: false as const, error: 'send_exception' }
  }
}

export interface ReengagementCopy {
  subject: string
  preview: string
  heading: string
  greeting: (name: string) => string
  body1: string
  body2: string
  cta: string
  footer1: string
  footer2: string
  footer3: string
}

export const reengagementCopy: Record<ReengagementBucket, Record<EmailLocale, ReengagementCopy>> = {
  warm: {
    zh: {
      subject: '好久不见，MokerSaaS 有新功能等你体验',
      preview: '您有一段时间没来了，我们新增了很多实用的功能，快来看看吧！',
      heading: '想念你，来看新功能',
      greeting: (name) => `${name}，您好：`,
      body1: '您有一段时间没使用 MokerSaaS 了。期间我们上线了不少新功能和改进，希望您会喜欢。',
      body2: '感谢您的陪伴，期待再次看到您的活跃身影。',
      cta: '立即体验新功能',
      footer1: '本邮件由 MokerSaaS 自动发送。',
      footer2: '如果您不想再收到此类邮件，可以取消订阅。',
      footer3: '取消邮件订阅',
    },
    en: {
      subject: "Been a while? New features await you on MokerSaaS",
      preview: "It's been a while since your last visit. We've added exciting new features — come check them out!",
      heading: 'Miss You — New Features Inside',
      greeting: (name) => `Hi ${name},`,
      body1: "It's been a while since your last visit. We've been busy adding new features and improvements we think you'll love.",
      body2: "Thanks for being part of MokerSaaS. We'd love to see you back!",
      cta: 'Try New Features',
      footer1: 'This is an automated email from MokerSaaS.',
      footer2: 'If you prefer not to receive emails like this, you can unsubscribe.',
      footer3: 'Unsubscribe',
    },
    ja: {
      subject: 'しばらくぶりのご挨拶 — MokerSaaSに新機能登場',
      preview: '最後にご利用顶いてから时日が経ちました。新しい機能が牺い上がっています！',
      heading: 'おかえりなさい — 新機能が登場',
      greeting: (name) => `${name} 様`,
      body1: '最後にご利用顶いてから時間が空きました。この間に多くの新機能・改善を追加しました。',
      body2: 'MokerSaaSを利用いただきありがとうございます。またのご登录をお待ちしています。',
      cta: '新機能を見る',
      footer1: '本メールは MokerSaaS から自動送信されています。',
      footer2: '此类メールの受信をご希望でない場合は購読解除できます。',
      footer3: '購読解除',
    },
    ko: {
      subject: '오랜만이에요 — MokerSaaS에 새로운 기능이 탄생했어요',
      preview: '마지막 방문 후 시간이 흘렀어요. 많은 새로운 기능이 추가되었답니다!',
      heading: '다시 만나서 반가워요 — 새로운 기능',
      greeting: (name) => `${name} 님, 안녕하세요`,
      body1: '마지막 방문 후 시간이 많이 지났어요. 그동안 많은 새 기능과 개선 사항이 추가되었답니다.',
      body2: 'MokerSaaS를 이용해 주셔서 감사합니다. 다시 뵐 수 있기를 기대할게요!',
      cta: '새로운 기능 보기',
      footer1: '본 메일은 MokerSaaS에서 자동 발송됩니다。',
      footer2: '此类 메일을 더 이상 원치 않으시면 구독을 해지할 수 있습니다。',
      footer3: '구독 해지',
    },
    tw: {
      subject: '好久不見，MokerSaaS 有新功能等你體驗',
      preview: '您有一段時間沒來了，我們新增了很多實用的功能，快來看看吧！',
      heading: '想念你，來看新功能',
      greeting: (name) => `${name}，您好：`,
      body1: '您有一段時間沒使用 MokerSaaS 了。期間我們上線了不少新功能和改進，希望您會喜歡。',
      body2: '感謝您的陪伴，期待再次看到您的活躍身影。',
      cta: '立即體驗新功能',
      footer1: '本郵件由 MokerSaaS 自動發送。',
      footer2: '如果您不想再收到此類郵件，可以取消訂閱。',
      footer3: '取消郵件訂閱',
    },
  },
  dormant: {
    zh: {
      subject: '您有专属福利待领取，MokerSaaS 等您回来',
      preview: '我们注意到您一段时间没访问了，这里有一份专为您准备的特别福利。',
      heading: '我们想念你，专属福利送你',
      greeting: (name) => `${name}，您好：`,
      body1: '我们注意到您已经有一段时间没有使用 MokerSaaS 了。我们想念您，也为您准备了一份专属福利作为感谢。',
      body2: '回来看看吧，希望这次能让您满意。',
      cta: '领取专属福利',
      footer1: '本邮件由 MokerSaaS 自动发送。',
      footer2: '如果您不想再收到此类邮件，可以取消订阅。',
      footer3: '取消邮件订阅',
    },
    en: {
      subject: "We miss you — a special offer just for you on MokerSaaS",
      preview: "It's been a while since your last visit. We have a special offer prepared exclusively for you.",
      heading: 'We Miss You — Exclusive Offer Inside',
      greeting: (name) => `Hi ${name},`,
      body1: "It's been a while since you last visited MokerSaaS. We miss you, and we've prepared a special offer as a token of our appreciation.",
      body2: "Come back and see what's waiting for you.",
      cta: 'Claim Your Offer',
      footer1: 'This is an automated email from MokerSaaS.',
      footer2: 'If you prefer not to receive emails like this, you can unsubscribe.',
      footer3: 'Unsubscribe',
    },
    ja: {
      subject: 'おかえりなさい — 特別な 혜택をご用意しました',
      preview: 'しばらくご利用顶いていませんが、为您准备了的特別な 혜택为您准备しました。',
      heading: 'お帰りなさい — 特別な 혜택をご用意',
      greeting: (name) => `${name} 様`,
      body1: 'しばらく MokerSaaS をご利用いただけていませんが、私たちがあなたのために特別な 혜택を用意しました。',
      body2: '是非またお会いできることを楽しみにしています。',
      cta: '혜택 받기',
      footer1: '本メールは MokerSaaS から自動送信されています。',
      footer2: '此类メールの受信をご希望でない場合は購読解除できます。',
      footer3: '購読解除',
    },
    ko: {
      subject: '환영합니다 — MokerSaaS가 당신을 위해 특별 혜택을 준비했어요',
      preview: '오랫동안 방문하지 않으셨지만, 당신만을 위한 특별한 혜택을 준비했답니다。',
      heading: '다시 오신 것을 환영합니다 — 특별 혜택',
      greeting: (name) => `${name} 님, 안녕하세요`,
      body1: '오랫동안 MokerSaaS를 방문하지 않으셨네요。당신을 위한 특별 혜택을 준비했답니다。',
      body2: '다시 방문해 주시면 정말 기쁠 거예요。',
      cta: '특별 혜택 받기',
      footer1: '본 메일은 MokerSaaS에서 자동 발송됩니다。',
      footer2: '此类 메일을 더 이상 원치 않으시면 구독을 해지할 수 있습니다。',
      footer3: '구독 해지',
    },
    tw: {
      subject: '您有專屬福利待領取，MokerSaaS 等您回來',
      preview: '我們注意到您一段時間沒訪問了，這裡有一份專為您準備的特別福利。',
      heading: '我們想念你，專屬福利送你',
      greeting: (name) => `${name}，您好：`,
      body1: '我們注意到您已經有一段時間沒有使用 MokerSaaS 了。我們想念您，也為您準備了一份專屬福利作為感謝。',
      body2: '回來看看吧，希望這次能讓您滿意。',
      cta: '領取專屬福利',
      footer1: '本郵件由 MokerSaaS 自動發送。',
      footer2: '如果您不想再收到此類郵件，可以取消訂閱。',
      footer3: '取消郵件訂閱',
    },
  },
  inactive: {
    zh: {
      subject: '限时回归优惠，仅剩 3 天 — MokerSaaS',
      preview: '我们想念您！现在回来可享受限时回归优惠，仅剩 3 天。',
      heading: '限时 3 天回归优惠',
      greeting: (name) => `${name}，您好：`,
      body1: '我们注意到您已经很久没有使用 MokerSaaS 了。为了感谢您曾经的陪伴，我们准备了一个限时回归优惠。',
      body2: '此优惠仅剩 3 天有效期，诚邀您回来继续体验。',
      cta: '立即获取优惠',
      footer1: '本邮件由 MokerSaaS 自动发送。',
      footer2: '如果您不想再收到此类邮件，可以取消订阅。',
      footer3: '取消邮件订阅',
    },
    en: {
      subject: "Your exclusive return offer expires in 3 days — MokerSaaS",
      preview: "We miss you! Claim your exclusive return offer — only 3 days left.",
      heading: '3-Day Return Offer',
      greeting: (name) => `Hi ${name},`,
      body1: "It's been a while since you last used MokerSaaS. As a token of our appreciation for your past support, we'd like to offer you an exclusive return deal.",
      body2: "This offer expires in 3 days. We'd love to welcome you back.",
      cta: 'Claim Offer Now',
      footer1: 'This is an automated email from MokerSaaS.',
      footer2: 'If you prefer not to receive emails like this, you can unsubscribe.',
      footer3: 'Unsubscribe',
    },
    ja: {
      subject: '限定回来了优惠 — 残り3日間有効',
      preview: 'おかえりなさい！限定回来了优惠让您のために3日間有効です。',
      heading: '3日間有効な回来了优惠',
      greeting: (name) => `${name} 様`,
      body1: '最後に MokerSaaS をご利用顶いてから已经很长时间。我们为您准备了限定的回来了优惠。',
      body2: 'この优惠は3日間有効です。お待ちしています。',
      cta: '优惠を obtain',
      footer1: '本メールは MokerSaaS から自動送信されています。',
      footer2: '此类メールの受信をご希望でない場合は購読解除できます。',
      footer3: '購読解除',
    },
    ko: {
      subject: '당신을 위한 특별回来了 혜택 — 3일만有効',
      preview: '오랜분이네요！3일 동안만有効な 특별 돌아온 혜택을 준비했답니다。',
      heading: '3일 동안有效的 특별 혜택',
      greeting: (name) => `${name} 님, 안녕하세요`,
      body1: '오랫동안 MokerSaaS를 방문하지 않으셨네요。당신을 위한 특별한 돌아온 혜택을 준비했어요。',
      body2: '이 혜택은 3일 동안만有效합니다。돌아와 주세요！',
      cta: '혜택 받기',
      footer1: '본 메일은 MokerSaaS에서 자동 발송됩니다。',
      footer2: '此类 메일을 더 이상 원치 않으시면 구독을 해지할 수 있습니다。',
      footer3: '구독 해지',
    },
    tw: {
      subject: '限時回歸優惠，僅剩 3 天 — MokerSaaS',
      preview: '我們想念您！現在回來可享受限時回歸優惠，僅剩 3 天。',
      heading: '限時 3 天回歸優惠',
      greeting: (name) => `${name}，您好：`,
      body1: '我們注意到您已經很久沒有使用 MokerSaaS 了。為了感謝您曾經的陪伴，我們準備了一個限時回歸優惠。',
      body2: '此優惠僅剩 3 天有效期，誠邀您回來繼續體驗。',
      cta: '立即獲取優惠',
      footer1: '本郵件由 MokerSaaS 自動發送。',
      footer2: '如果您不想再收到此類郵件，可以取消訂閱。',
      footer3: '取消郵件訂閱',
    },
  },
  churned: {
    zh: {
      subject: '感谢一路相伴，我们依然在这里等你回来',
      preview: '即使您已经离开，我们依然保留着您的账户，期待您再次回来。',
      heading: '感谢您曾经的陪伴',
      greeting: (name) => `${name}，您好：`,
      body1: '我们注意到您已经很久没有使用 MokerSaaS 了。感谢您曾经选择我们，即使您离开了，我们依然保留着您的账户和所有数据。',
      body2: '如果您愿意，我们随时欢迎您的回归。也欢迎您将 MokerSaaS 推荐给需要的朋友。',
      cta: '重新激活账户',
      footer1: '本邮件由 MokerSaaS 自动发送。',
      footer2: '如果您不想再收到此类邮件，可以取消订阅。',
      footer3: '取消邮件订阅',
    },
    en: {
      subject: "Thank you for being with us — we're still here whenever you're ready",
      preview: "Even though you've been away, we've kept your account safe. We'd love to have you back.",
      heading: 'Thank You for Being Part of Our Journey',
      greeting: (name) => `Hi ${name},`,
      body1: "We've noticed you haven't been active on MokerSaaS for a while. Thank you for having been part of our community. Even though you've stepped away, we've kept your account and data safe.",
      body2: "When you're ready, we'd love to welcome you back. And if MokerSaaS could help someone you know, feel free to share it with them.",
      cta: 'Reactivate Account',
      footer1: 'This is an automated email from MokerSaaS.',
      footer2: 'If you prefer not to receive emails like this, you can unsubscribe.',
      footer3: 'Unsubscribe',
    },
    ja: {
      subject: '長い間のご愛顧に感謝します — いつでも戻って来吧',
      preview: '離れていても、あなたのアカウントは安全に保たれています。またお会いできるのを楽しみにしています。',
      heading: '長い間のご愛顧に感謝します',
      greeting: (name) => `${name} 様`,
      body1: '長い間 MokerSaaS をご爱顧いただきありがとうございます。離れていても、あなたのアカウントとデータは安全に保たれています。',
      body2: 'もしよければ、いつでも。欢迎您をじます。また、MokerSaaS がお友達のお役にも立ちそうであれば、ぜひご 추천ください。',
      cta: 'アカウントを再開',
      footer1: '本メールは MokerSaaS から自動送信されています。',
      footer2: '此类メールの受信をご希望でない場合は購読解除できます。',
      footer3: '購読解除',
    },
    ko: {
      subject: '함께해 주셔서 감사합니다 — 언제든 다시 오세요',
      preview: '떠나셨더라도 계정은 안전하게 보관하고 있습니다。다시 만나뵙게 되기를 바랍니다。',
      heading: '함께해 주셔서 감사합니다',
      greeting: (name) => `${name} 님`,
      body1: '긴 시간 MokerSaaS를 이용해주셔서 감사합니다。떠나셨더라도 계정과 데이터는 안전하게 보관하고 있습니다。',
      body2: '언제든 다시 오시면 기쁠 거예요。또한 MokerSaaS가 지인분께 도움이 될 것 같으시다면 언제든 추천해 주세요。',
      cta: '계정 재활성화',
      footer1: '본 메일은 MokerSaaS에서 자동 발송됩니다。',
      footer2: '此类 메일을 더 이상 원치 않으시면 구독을 해지할 수 있습니다。',
      footer3: '구독 해지',
    },
    tw: {
      subject: '感謝一路相伴，我們依然在這裡等你回來',
      preview: '即使您已經離開，我們依然保留著您的帳戶，期待您再次回來。',
      heading: '感謝您曾經的陪伴',
      greeting: (name) => `${name}，您好：`,
      body1: '我們注意到您已經很久沒有使用 MokerSaaS 了。感謝您曾經選擇我們，即使您離開了，我們依然保留著您的帳戶和所有資料。',
      body2: '如果您願意，我們隨時歡迎您的回歸。也歡迎您將 MokerSaaS 推薦給需要的朋友。',
      cta: '重新啟動帳戶',
      footer1: '本郵件由 MokerSaaS 自動發送。',
      footer2: '如果您不想再收到此類郵件，可以取消訂閱。',
      footer3: '取消郵件訂閱',
    },
  },
  sleeping_paid: {
    zh: {
      subject: '感谢您曾经的信任，MokerSaaS 为您准备了专属回归礼',
      preview: '我们注意到您曾是我们的付费用户，感谢您一路陪伴。为您准备了专属优惠，期待您回来。',
      heading: '欢迎回来，专属优惠等您领取',
      greeting: (name) => `${name}，您好：`,
      body1: '感谢您曾选择 MokerSaaS 作为您的工具。我们注意到您已有一段时间没有使用，感谢您曾经的陪伴。',
      body2: '为了表达感谢，我们为您准备了一份专属回归礼。无论您是想继续使用，还是想了解最新功能，我们都期待您的回归。',
      cta: '领取专属回归礼',
      footer1: '本邮件由 MokerSaaS 自动发送。',
      footer2: '如果您不想再收到此类邮件，可以取消订阅。',
      footer3: '取消邮件订阅',
    },
    en: {
      subject: "Welcome back — your exclusive return offer is here",
      preview: "As a former paying customer, you've earned a special welcome-back offer. We'd love to have you back.",
      heading: 'Welcome Back — Exclusive Offer Awaits',
      greeting: (name) => `Hi ${name},`,
      body1: "Thank you for being a valued MokerSaaS customer. We've missed you and want to welcome you back with an exclusive offer.",
      body2: "Whether you're looking to continue your journey or explore what's new, we're here for you. Claim your special return gift on us.",
      cta: 'Claim Your Return Gift',
      footer1: 'This is an automated email from MokerSaaS.',
      footer2: 'If you prefer not to receive emails like this, you can unsubscribe.',
      footer3: 'Unsubscribe',
    },
    ja: {
      subject: 'おかえりなさい — 特別な復帰プランをご用意しました',
      preview: 'かつて有料お客様だったあなたに、特別な復帰ギフトをご用意しました。',
      heading: 'おかえりなさい — 特別な復帰ギフト',
      greeting: (name) => `${name} 様`,
      body1: 'かつて MokerSaaS をご利用いただき、誠にありがとうございます。ご不在の間、私たちはあなたの復帰を待ち望んでいました。',
      body2: '特別な復帰ギフトをご用意しましたので、ぜひ受け取ってしてください。再びお会いできるのを楽しみにしています。',
      cta: '復帰ギフトを受け取る',
      footer1: '本メールは MokerSaaS から自動送信されています。',
      footer2: '此类メールの受信をご希望でない場合は購読解除できます。',
      footer3: '購読解除',
    },
    ko: {
      subject: '다시 오신 것을 환영합니다 — 특별한 복귀 혜택이 기다리고 있어요',
      preview: '예전 유료 고객이셨던 당신에게 특별한 복귀 혜택을 준비했어요.',
      heading: '다시 오신 것을 환영합니다',
      greeting: (name) => `${name} 님`,
      body1: '예전에 MokerSaaS 를 이용해 주셔서 진심으로 감사드립니다. 당신이 없는 동안 우리는 당신의 복귀를 손꼽아 기다렸어요.',
      body2: '특별한 복귀 혜택을 준비했으니 꼭 받아주세요. 다시 만나게 되어 정말 기쁩니다.',
      cta: '복귀 혜택 받기',
      footer1: '본 메일은 MokerSaaS에서 자동 발송됩니다。',
      footer2: '此类 메일을 더 이상 원치 않으시면 구독을 해지할 수 있습니다。',
      footer3: '구독 해지',
    },
    tw: {
      subject: '歡迎回來 — 我們為您準備了專屬回歸禮',
      preview: '感謝您曾是我們的付費客戶，我們為您準備了專屬優惠，期待您回來。',
      heading: '歡迎回來，專屬優惠等您領取',
      greeting: (name) => `${name}，您好：`,
      body1: '感謝您曾選擇 MokerSaaS 作為您的工具。我們注意到您已有一段時間沒有使用，感謝您一路的陪伴。',
      body2: '為了表達感謝，我們為您準備了一份專屬回歸禮。無論您是想繼續使用，還是想了解最新功能，我們都期待您的回歸。',
      cta: '領取專屬回歸禮',
      footer1: '本郵件由 MokerSaaS 自動發送。',
      footer2: '如果您不想再收到此類郵件，可以取消訂閱。',
      footer3: '取消郵件訂閱',
    },
  },
}

/**
 * 渲染召回邮件 HTML（纯字符串模板，无 env 依赖）
 */
// HTML 字符转义:阻断 subject/body/cta 等用户/管理员输入导致的 XSS。
// 同时处理 href 属性中的双引号,避免属性值提前闭合。
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function generateReengagementEmailHTML(
  copy: ReengagementCopy,
  name: string | null,
  ctaUrl: string,
  unsubscribeUrl: string,
): string {
  const safeName = name?.trim() || 'User'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(copy.subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">

    <div style="background: white; padding: 40px; border-radius: 16px; margin-bottom: 30px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #f1f5f9;">
      <h2 style="color: #1e293b; margin: 0 0 24px 0; text-align: center; font-size: 26px; font-weight: 700;">${escapeHtml(copy.heading)}</h2>

      <p style="color: #1e293b; line-height: 1.7; margin-bottom: 16px; font-size: 16px;">${escapeHtml(copy.greeting(safeName))}</p>
      <p style="color: #1e293b; line-height: 1.7; margin-bottom: 16px; font-size: 16px;">${escapeHtml(copy.body1)}</p>
      <p style="color: #475569; line-height: 1.7; margin-bottom: 32px; font-size: 16px;">${escapeHtml(copy.body2)}</p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${escapeHtml(ctaUrl)}" style="background: #d97706; color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
          ${escapeHtml(copy.cta)}
        </a>
      </div>
    </div>

    <div style="text-align: center; padding: 0 20px;">
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin-bottom: 8px;">${escapeHtml(copy.footer1)}</p>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin-bottom: 8px;">${escapeHtml(copy.footer2)}</p>
      <p style="margin-top: 16px;">
        <a href="${escapeHtml(unsubscribeUrl)}" style="color: #94a3b8; font-size: 13px; text-decoration: underline;">${escapeHtml(copy.footer3)}</a>
      </p>
    </div>
  </div>
</body>
</html>`
} 