import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

interface TermsLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  // 验证 locale 是否有效
  const locales = ['en', 'zh', 'ja', 'ko', 'tw']
  if (!locales.includes(locale)) {
    notFound()
  }

  const t = await getTranslations({ locale, namespace: 'metadata.terms' })
  
  return {
    title: t('title'),
    description: t('description')
  }
}

export default async function TermsLayout({ children, params }: TermsLayoutProps) {
  const { locale } = await params
  // 验证 locale 是否有效
  const locales = ['en', 'zh', 'ja', 'ko', 'tw']
  if (!locales.includes(locale)) {
    notFound()
  }

  return children
} 