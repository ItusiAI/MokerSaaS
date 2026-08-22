import createIntlMiddleware from 'next-intl/middleware'

// Next.js 16 重命名: middleware -> proxy
// 默认导出函数名应为 `proxy`，签名与原 middleware 相同。
export default function proxy(request: unknown) {
  const handle = createIntlMiddleware({
    // 支持的语言
    locales: ['en', 'zh-CN', 'ja', 'ko', 'zh-TW'],
    // 默认语言（不带 URL 前缀，根路径 / 直接渲染）
    defaultLocale: 'en',
    // 'as-needed': 默认 locale (en) 不显示前缀；其他 locale 仍走 /zh-CN、/ja、/ko、/zh-TW
    // 同时 next-intl 自动把 /en/... 301 重定向到 /...
    localePrefix: 'as-needed',
    // 关闭基于 Accept-Language / cookie 的自动 302 重定向
    // 用户首次访问 / 永远是英文版；切换语言需要主动点击链接
    localeDetection: false,
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