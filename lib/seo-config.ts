export const seoConfig = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || '',
  siteName: 'MokerSaaS',

  // 社交媒体设置
  social: {
    twitter: '@zyailive',
    email: 'app@itusi.cn',
    wechat: 'zyailive01',
  },

  // 验证码设置
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    bing: process.env.BING_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    baidu: process.env.BAIDU_SITE_VERIFICATION,
  },

  // 分析工具设置
  analytics: {
    googleAnalytics: process.env.NEXT_PUBLIC_GA_ID,
    baiduAnalytics: process.env.NEXT_PUBLIC_BAIDU_ANALYTICS_ID,
    // Umami 统计（可选）
    // 在环境变量中设置：
    // NEXT_PUBLIC_UMAMI_WEBSITE_ID=你的站点ID
    // NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js 或自建脚本地址
    umamiWebsiteId: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
    umamiScriptUrl: process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || 'https://cloud.umami.is/script.js',
  },

  // 图片设置
  images: {
    logo: '/logo.png',
    ogImage: '/logo.png',
    favicon: '/favicon.ico',
  },

  // 结构化数据设置
  organization: {
    name: 'MokerSaaS',
    foundingDate: '2025',
    industry: 'Software Development',
    numberOfEmployees: '1-10',
    contactEmail: 'app@itusi.cn',
    url: 'https://mokersaas.com',
    description: 'Enterprise-ready SaaS template for global markets. Build SaaS at lightning speed, launch in hours. Features: authentication, Stripe payments, multi-language i18n, SEO, admin dashboard, referral & affiliate systems.',
    keywords: ['SaaS Template', 'Next.js', 'TypeScript', 'Global Markets', 'Multi-language', 'Admin Dashboard', 'Referral System', 'Affiliate System', 'Stripe', 'Build SaaS Fast'],
    sameAs: [
      'https://github.com/ItusiAI',
      'https://twitter.com/zyailive'
    ]
  }
}

// 生成完整URL的辅助函数
export function getFullUrl(path: string) {
  return `${seoConfig.baseUrl}${path}`
}
