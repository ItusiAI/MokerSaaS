import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

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
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!locales.includes(locale)) {
    notFound()
  }

  const t = await getTranslations({ locale, namespace: 'metadata.cookies' })

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    DEFAULT_BASE_URL

  const localizedBase = (loc: string): string =>
    loc === 'en' ? baseUrl : `${baseUrl}/${loc}`

  const currentUrl = `${localizedBase(locale)}/cookies`
  const ogImageUrl = `${baseUrl}/images/og.png`

  return {
    title: t('title'),
    description: t('description'),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: currentUrl,
      languages: {
        'x-default': `${baseUrl}/cookies`,
        'en': `${baseUrl}/cookies`,
        'zh-CN': `${baseUrl}/zh-CN/cookies`,
        'zh-TW': `${baseUrl}/zh-TW/cookies`,
        'ja': `${baseUrl}/ja/cookies`,
        'ko': `${baseUrl}/ko/cookies`,
      },
    },
    openGraph: {
      type: 'website',
      locale: resolveLocale(locale),
      url: currentUrl,
      title: t('title'),
      description: t('description'),
      siteName: 'MokerSaaS',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: 'MokerSaaS' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [ogImageUrl],
    },
  }
}

export default async function CookieLayout({
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

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    DEFAULT_BASE_URL

  const t = await getTranslations({ locale, namespace: 'metadata.cookies' })

  const languages: Record<string, string> = {
    'x-default': `${baseUrl}/cookies`,
    'en': `${baseUrl}/cookies`,
    'zh-CN': `${baseUrl}/zh-CN/cookies`,
    'zh-TW': `${baseUrl}/zh-TW/cookies`,
    'ja': `${baseUrl}/ja/cookies`,
    'ko': `${baseUrl}/ko/cookies`,
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: t('title'),
    url: `${baseUrl}/cookies`,
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
        {Object.entries(languages).map(([lang, href]) => (
          <link key={lang} rel="alternate" hrefLang={lang} href={href} />
        ))}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      {children}
    </>
  )
}
