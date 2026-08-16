import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => {
  // 验证和处理locale
  const validLocale = locale && ['en', 'zh', 'ja', 'ko', 'tw'].includes(locale) ? locale : 'en'
  
  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default
  }
}) 