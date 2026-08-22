import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'referral_page' })

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://mokersaas.com'
  const localizedBase = (loc: string): string =>
    loc === 'en' ? baseUrl : `${baseUrl}/${loc}`
  const currentUrl = `${localizedBase(locale)}/referral`
  const title = t('title')
  const description = t('subtitle')
  const keywords = t('keywords')

  const ogLocale =
    locale === 'zh-CN'
      ? 'zh_CN'
      : locale === 'zh-TW'
      ? 'zh_TW'
      : locale === 'ja'
      ? 'ja_JP'
      : locale === 'ko'
      ? 'ko_KR'
      : 'en_US'

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
      locale: ogLocale,
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
  }
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

export default async function ReferralLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://mokersaas.com'

  const t = await getTranslations({ locale, namespace: 'referral_page' })

  const languages: Record<string, string> = {
    'x-default': `${baseUrl}/referral`,
    'en': `${baseUrl}/referral`,
    'zh-CN': `${baseUrl}/zh-CN/referral`,
    'zh-TW': `${baseUrl}/zh-TW/referral`,
    'ja': `${baseUrl}/ja/referral`,
    'ko': `${baseUrl}/ko/referral`,
  }

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

  return (
    <>
      <head>
        {Object.entries(languages).map(([lang, href]) => (
          <link
            key={lang}
            rel="alternate"
            hrefLang={lang}
            href={href}
          />
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
