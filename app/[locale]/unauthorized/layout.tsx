import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'unauthorized' })
  
  return {
    title: t('title'),
    description: t('description'),
    robots: { index: false },
  }
}

export default function UnauthorizedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 