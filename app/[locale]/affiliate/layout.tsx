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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  const currentUrl = baseUrl ? `${baseUrl}/${locale}/affiliate` : ''
  const title = t('title')
  const description = t('subtitle')
  const keywords =
    locale === 'zh'
      ? '推广计划,推广返利,佣金奖励,合作推广,SaaS 推广,MokerSaaS'
      : 'Affiliate Program,Affiliate Rewards,Commission Rewards,Partner Promotion,SaaS Affiliate,MokerSaaS'

  return {
    title,
    description,
    keywords,
    metadataBase: baseUrl ? new URL(baseUrl) : null,
    alternates: baseUrl
      ? {
          canonical: currentUrl,
          languages: {
            zh: `${baseUrl}/zh/affiliate`,
            en: `${baseUrl}/en/affiliate`,
          },
        }
      : undefined,
    openGraph: {
      type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
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

