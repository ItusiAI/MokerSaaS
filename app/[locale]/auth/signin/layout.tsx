import type React from "react"
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  const t = await getTranslations({ locale, namespace: 'auth' })

  return {
    title: t('meta_title'),
    description: t('signin_description'),
    robots: { index: false },
  }
}

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
} 