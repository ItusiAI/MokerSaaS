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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  const currentUrl = baseUrl ? `${baseUrl}/${locale}/referral` : ''
  const title = t('title')
  const description = t('subtitle')
  const keywords =
    locale === 'zh'
      ? '推荐计划,邀请奖励,合作推广,SaaS 推荐,MokerSaaS'
      : 'Referral Program,Invite Rewards,Partner Promotion,SaaS Referral,MokerSaaS'

  return {
    title,
    description,
    keywords,
    metadataBase: baseUrl ? new URL(baseUrl) : null,
    alternates: baseUrl
      ? {
          canonical: currentUrl,
          languages: {
            zh: `${baseUrl}/zh/referral`,
            en: `${baseUrl}/en/referral`,
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

