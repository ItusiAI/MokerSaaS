import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { SiteChrome } from '@/components/home/site-chrome'

const locales = ['en', 'zh-CN', 'ja', 'ko', 'zh-TW']
const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://mokersaas.com'

function resolveLocale(locale: string) {
  if (locale === 'zh-CN') return 'zh_CN'
  if (locale === 'zh-TW') return 'zh_TW'
  if (locale === 'ja') return 'ja_JP'
  if (locale === 'ko') return 'ko_KR'
  return 'en_US'
}

export function generateHtmlAttributes({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  return params.then(async ({ locale }) => {
    const localeMap: Record<string, string> = {
      'en': 'en-US',
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
    }
    return { lang: localeMap[locale] ?? locale }
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!locales.includes(locale)) {
    notFound()
  }

  const t = await getTranslations({ locale, namespace: 'referral_page' })

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    DEFAULT_BASE_URL
  const localizedBase = (loc: string): string =>
    loc === 'en' ? baseUrl : `${baseUrl}/${loc}`
  const currentUrl = `${localizedBase(locale)}/referral`
  const title = t('title')
  const description = t('subtitle')
  const keywords = t('keywords')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MokerSaaS - Referral Program',
    url: `${baseUrl}/referral`,
    description: t('subtitle'),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    provider: {
      '@type': 'Organization',
      name: 'MokerSaaS',
      url: baseUrl,
    },
  }

  return {
    title,
    description,
    keywords,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: currentUrl,
      languages: {
        'x-default': `${baseUrl}/referral`,
        'en': `${baseUrl}/referral`,
        'zh-CN': `${baseUrl}/zh-CN/referral`,
        'zh-TW': `${baseUrl}/zh-TW/referral`,
        'ja': `${baseUrl}/ja/referral`,
        'ko': `${baseUrl}/ko/referral`,
      },
    },
    openGraph: {
      type: 'website',
      locale: resolveLocale(locale),
      url: currentUrl,
      title,
      description,
      siteName: 'MokerSaaS',
      images: [
        {
          url: `${baseUrl}/images/og.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@zyailive',
      images: [`${baseUrl}/images/og.png`],
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      yahoo: process.env.YAHOO_VERIFICATION,
    },
    other: {
      'theme-color': '#00F0FF',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
      'apple-mobile-web-app-title': 'MokerSaaS',
    },
  }
}

export default async function ReferralLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!locales.includes(locale)) {
    notFound()
  }

  const messages = await getMessages({ locale })

  return (
    <>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <div data-locale={locale}>
          <SiteChrome>{children}</SiteChrome>
        </div>
      </NextIntlClientProvider>
    </>
  )
}
