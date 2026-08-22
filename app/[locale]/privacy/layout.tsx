import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import type { Metadata } from 'next'
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

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!locales.includes(locale)) {
    notFound()
  }

  const t = await getTranslations({ locale, namespace: 'metadata.privacy' })

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    DEFAULT_BASE_URL

  const localizedBase = (loc: string): string =>
    loc === 'en' ? baseUrl : `${baseUrl}/${loc}`

  const currentUrl = `${localizedBase(locale)}/privacy`
  const ogImageUrl = `${baseUrl}/images/og.png`

  return {
    title: t('title'),
    description: t('description'),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: currentUrl,
      languages: {
        'x-default': `${baseUrl}/privacy`,
        'en': `${baseUrl}/privacy`,
        'zh-CN': `${baseUrl}/zh-CN/privacy`,
        'zh-TW': `${baseUrl}/zh-TW/privacy`,
        'ja': `${baseUrl}/ja/privacy`,
        'ko': `${baseUrl}/ko/privacy`,
      },
    },
    openGraph: {
      type: 'website',
      locale: resolveLocale(locale),
      url: currentUrl,
      title: t('title'),
      description: t('description'),
      siteName: 'MokerSaaS',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: t('title') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [ogImageUrl],
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

export default async function PrivacyLayout({
  children,
  params
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!locales.includes(locale)) {
    notFound()
  }

  const messages = await getMessages({ locale })

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    DEFAULT_BASE_URL

  const t = await getTranslations({ locale, namespace: 'metadata.privacy' })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: t('title'),
    url: `${baseUrl}/privacy`,
    description: t('description'),
    isPartOf: {
      '@type': 'WebSite',
      name: 'MokerSaaS',
      url: baseUrl,
    },
  }

  return (
    <>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <div data-locale={locale}>
          <SiteChrome>{children}</SiteChrome>
        </div>
      </NextIntlClientProvider>
    </>
  )
}
