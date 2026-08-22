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
    ''
  const localizedBase = (loc: string): string => loc === 'en' ? baseUrl : `${baseUrl}/${loc}`
  const currentUrl = baseUrl ? `${localizedBase(locale)}/referral` : ''
  const title = t('title')
  const description = t('subtitle')
  const keywords = t('keywords')

  return {
    title,
    description,
    keywords,
    metadataBase: baseUrl ? new URL(baseUrl) : null,
    alternates: baseUrl
      ? {
          canonical: currentUrl,
          languages: {
            'zh-CN': `${baseUrl}/zh-CN/referral`,
            'zh-TW': `${baseUrl}/zh-TW/referral`,
            en: `${baseUrl}/referral`,
            ja: `${baseUrl}/ja/referral`,
            ko: `${baseUrl}/ko/referral`,
          },
        }
      : undefined,
    openGraph: {
      type: 'website',
      locale: locale === 'zh-CN' ? 'zh_CN' : locale === 'zh-TW' ? 'zh_TW' : locale === 'ja' ? 'ja_JP' : locale === 'ko' ? 'ko_KR' : 'en_US',
      url: currentUrl,
      title,
      description,
      siteName: 'MokerSaaS',
      images:
        baseUrl !== ''
          ? [
              {
                url: `${baseUrl}/images/referralhaibao.png`,
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
      images: baseUrl ? [`${baseUrl}/images/referralhaibao.png`] : [],
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
  await params
  return <>{children}</>
}

