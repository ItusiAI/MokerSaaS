import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  const currentDate = new Date().toISOString()

  // 定义支持的语言
  const locales = ['zh', 'en']
  
  // 定义页面路径
  const pages = [
    '',  // 首页
    '/terms',
    '/privacy',
    '/cookies',
  ] 

  // 生成所有语言版本的页面
  const sitemapEntries: MetadataRoute.Sitemap = []

  // 为每个语言生成页面
  locales.forEach(locale => {
    pages.forEach(page => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: currentDate,
        changeFrequency: page === '' ? 'daily' : 'weekly',
        priority: page === '' ? 1.0 : 0.8,
        alternates: {
          languages: {
            'zh': `${baseUrl}/zh${page}`,
            'en': `${baseUrl}/en${page}`,
          }
        }
      })
    })
  })

  // 添加根路径重定向
  sitemapEntries.push({
    url: baseUrl,
    lastModified: currentDate,
    changeFrequency: 'daily',
    priority: 1.0,
  })

  return sitemapEntries
}
