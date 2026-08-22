import type React from "react"
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
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

  const t = await getTranslations({ locale, namespace: 'metadata' })

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    DEFAULT_BASE_URL

  const localizedBase = (loc: string): string =>
    loc === 'en' ? baseUrl : `${baseUrl}/${loc}`

  const currentUrl = localizedBase(locale)
  const ogImageUrl = `${baseUrl}/images/og.png`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MokerSaaS',
    url: currentUrl,
    description: t('description'),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: locale,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    publisher: {
      '@type': 'Organization',
      name: 'MokerSaaS',
      url: baseUrl,
    },
    provider: {
      '@type': 'Organization',
      name: 'MokerSaaS',
      url: baseUrl,
    },
  }

  return {
    title: {
      default: t('title'),
      template: `%s | ${t('shortTitle')}`,
    },
    description: t('description'),
    keywords: t('keywords'),
    applicationName: 'MokerSaaS',
    authors: [{ name: 'MokerSaaS Team', url: 'https://mokersaas.com' }],
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
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: currentUrl,
      languages: {
        'x-default': baseUrl,
        'en': baseUrl,
        'zh-CN': `${baseUrl}/zh-CN`,
        'zh-TW': `${baseUrl}/zh-TW`,
        'ja': `${baseUrl}/ja`,
        'ko': `${baseUrl}/ko`,
      },
    },
    openGraph: {
      type: 'website',
      locale: resolveLocale(locale),
      url: currentUrl,
      title: t('title'),
      description: t('description'),
      siteName: 'MokerSaaS',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      creator: 'MokerSaaS',
      images: [ogImageUrl],
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
    other: {
      'theme-color': '#00F0FF',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
      'apple-mobile-web-app-title': 'MokerSaaS',
      'application/ld+json': JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
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
