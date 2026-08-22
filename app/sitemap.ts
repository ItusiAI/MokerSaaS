import { MetadataRoute } from 'next'

/**
 * SEO 站点地图 (sitemap.xml)
 *
 * 关键约束(Google sitemap 规范 + hreflang 规范):
 *   1. 所有 <loc> 与 <xhtml:link href> 必须是绝对 URL
 *   2. hreflang 必须包含 x-default,指向"未指定语言用户"该看到的版本(本仓库指向英文版 /)
 *   3. 站点地图条目不能为空
 *
 * URL 策略(与 proxy.ts 对齐):
 *   - 默认 locale (en) 不带前缀,根路径 / 即英文版
 *   - 其他 locale 仍走 /zh-CN、/ja、/ko、/zh-TW
 *
 * baseUrl:
 *   - 必须由 NEXT_PUBLIC_BASE_URL 注入(绝对 URL,例如 https://mokersaas.com)
 *   - 未设置时使用占位 https://example.com,避免输出相对路径;生产环境必须在 .env.local 中显式配置
 */
const DEFAULT_BASE_URL = 'https://mokersaas.com'

export default function sitemap(): MetadataRoute.Sitemap {
  // 优先用 SEO 专用 URL；向后兼容 NEXT_PUBLIC_APP_URL
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    DEFAULT_BASE_URL
  // 去掉末尾斜杠,避免 //foo 这种双斜杠
  const baseUrl = rawBaseUrl.replace(/\/+$/, '')

  // 默认 locale (en) 不带前缀;其他 locale 仍走 /zh-CN、/ja、/ko、/zh-TW
  const urlFor = (locale: string, page: string): string => {
    const path = page === '' ? '' : page
    if (locale === 'en') {
      return `${baseUrl}${path === '' ? '/' : path}`
    }
    return `${baseUrl}/${locale}${path}`
  }

  // 定义页面路径
  const pages = [
    '',  // 首页
    '/terms',
    '/privacy',
    '/cookies',
  ] as const

  // 支持的语言 (BCP47 locale,与 proxy.ts 一致)
  const locales = ['en', 'zh-CN', 'ja', 'ko', 'zh-TW'] as const

  // 为每种语言 + 每个页面生成 sitemap 条目
  const sitemapEntries: MetadataRoute.Sitemap = []

  pages.forEach((page) => {
    locales.forEach((locale) => {
      const url = urlFor(locale, page)

      // 构建 alternates.languages: 包含 x-default + 所有语言版本
      const languages: Record<string, string> = {
        // x-default 指向默认版本 (英文根路径)
        'x-default': urlFor('en', page),
      }
      locales.forEach((loc) => {
        languages[loc] = urlFor(loc, page)
      })

      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'daily' : 'weekly',
        priority: page === '' ? 1.0 : 0.8,
        alternates: { languages },
      })
    })
  })

  return sitemapEntries
}