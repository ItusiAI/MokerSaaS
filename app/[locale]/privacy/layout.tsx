import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

const locales = ['en', 'zh']

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  
  if (!locales.includes(locale)) {
    notFound()
  }

  const t = await getTranslations({ locale, namespace: 'metadata.privacy' })
  
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function PrivacyLayout({
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

  return children
} 