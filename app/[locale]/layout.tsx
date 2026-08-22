import type React from "react"
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SiteChrome } from '@/components/home/site-chrome'

const locales = ['en', 'zh-CN', 'ja', 'ko', 'zh-TW']

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  // 验证locale是否有效
  if (!locales.includes(locale)) {
    notFound()
  }

  const t = await getTranslations({ locale, namespace: 'metadata' })

  // 获取基础URL，如果未设置环境变量则为空
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  const currentUrl = baseUrl ? `${baseUrl}/${locale}` : ''

  return {
    title: {
      default: t('title'),
      template: `%s | ${t('shortTitle')}`
    },
    description: t('description'),
    keywords: t('keywords'),
    applicationName: 'MokerSaaS',
    authors: [{ name: 'MokerSaaS Team', url: 'https://github.com/zyailive/MokerSaaS' }],
    creator: 'MokerSaaS',
    publisher: 'MokerSaaS',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    manifest: '/manifest.json',
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
      apple: '/favicon.ico',
    },
    metadataBase: baseUrl ? new URL(baseUrl) : null,
    alternates: baseUrl ? {
      canonical: currentUrl,
      languages: {
        'zh-CN': `${baseUrl}/zh-CN`,
        'zh-TW': `${baseUrl}/zh-TW`,
        'en': `${baseUrl}/en`,
        'ja': `${baseUrl}/ja`,
        'ko': `${baseUrl}/ko`,
      },
    } : undefined,
    openGraph: {
      type: 'website',
      locale: locale === 'zh-CN' ? 'zh_CN' : locale === 'zh-TW' ? 'zh_TW' : locale === 'ja' ? 'ja_JP' : locale === 'ko' ? 'ko_KR' : 'en_US',
      url: currentUrl,
      title: t('title'),
      description: t('description'),
      siteName: 'MokerSaaS - Open Source SaaS Template',
      images: baseUrl ? [
        {
          url: `${baseUrl}/images/homehaibao.png`,
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      creator: '@zyailive',
      images: baseUrl ? [`${baseUrl}/images/homehaibao.png`] : [],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      yahoo: process.env.YAHOO_VERIFICATION,
    },
    category: 'technology',
    classification: 'Open Source SaaS Template, Web Development, Enterprise Software',
    other: {
      'theme-color': '#00F0FF',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
      'apple-mobile-web-app-title': 'MokerSaaS',
    },
  }
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  // 在Next.js 16中，params需要被await
  const { locale } = await params
  
  // 验证locale是否有效
  if (!locales.includes(locale)) {
    notFound()
  }

  // 使用getMessages从i18n配置获取翻译，传递locale参数
  const messages = await getMessages({ locale })

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <div data-locale={locale}>
        <SiteChrome>{children}</SiteChrome>
      </div>
    </NextIntlClientProvider>
  )
}
