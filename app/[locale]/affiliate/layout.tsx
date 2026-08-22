import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'affiliate_page' })

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ''
  const localizedBase = (loc: string): string => loc === 'en' ? baseUrl : `${baseUrl}/${loc}`
  const currentUrl = baseUrl ? `${localizedBase(locale)}/affiliate` : ''
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
    metadataBase: baseUrl ? new URL(baseUrl) : null,
    alternates: baseUrl
      ? {
          canonical: currentUrl,
          languages: {
            'zh-CN': `${baseUrl}/zh-CN/affiliate`,
            'zh-TW': `${baseUrl}/zh-TW/affiliate`,
            en: `${baseUrl}/affiliate`,
            ja: `${baseUrl}/ja/affiliate`,
            ko: `${baseUrl}/ko/affiliate`,
          },
        }
      : undefined,
    openGraph: {
      type: 'website',
      locale: ogLocale,
      url: currentUrl,
      title,
      description,
      siteName: 'MokerSaaS',
      images:
        baseUrl !== ''
          ? [
              {
                url: `${baseUrl}/images/affiliatehaibao.png`,
                width: 1200,
                height: 630,
                alt: title,
              },
            ]
          : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@zyailive',
      images: baseUrl ? [`${baseUrl}/images/affiliatehaibao.png`] : [],
    },
  }
}

export default async function AffiliateLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  await params
  return <>{children}</>
}

