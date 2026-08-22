import createIntlMiddleware from 'next-intl/middleware'

// Next.js 16 重命名: middleware -> proxy
// 默认导出函数名应为 `proxy`，签名与原 middleware 相同。
export default function proxy(request: unknown) {
  const handle = createIntlMiddleware({
    // 支持的语言
    locales: ['en', 'zh-CN', 'ja', 'ko', 'zh-TW'],
    // 默认语言
    defaultLocale: 'en',
    // 在路径中总是显示语言前缀
    localePrefix: 'always',
  })
  return handle(request as Parameters<typeof handle>[0])
}

export const config = {
  // 匹配所有路径，但排除以下路径：
  // - api: API路径（包括NextAuth）
  // - _next: Next.js内部文件和静态资源
  // - _vercel: Vercel部署文件
  // - 静态文件（包含点的文件，如.ico, .png等）
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}