"use client"

import { useSearchParams, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

export function AuthError() {
  const searchParams = useSearchParams()
  const params = useParams()
  const rawLocale = params.locale as string
  const locale = (['en', 'zh', 'ja', 'ko', 'tw'] as const).includes(rawLocale as any) ? rawLocale as 'en' | 'zh' | 'ja' | 'ko' | 'tw' : 'en'
  const error = searchParams.get('error')
  const t = useTranslations('auth')

  const getErrorMessage = (error: string | null) => {
    if (!error) return t('errors.default')

    const errorKey = `errors.${error}` as any
    try {
      return t(errorKey)
    } catch {
      return t('errors.default')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 pt-24 pb-12">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-secondary/80 backdrop-blur-sm cyber-glow-subtle">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center">
            <AlertCircle className="text-white h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {t('error_page_title')}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('error_page_description')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert className="border-red-500/30 bg-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              {getErrorMessage(error)}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground cyber-glow">
              <Link href={`/${locale}/auth/signin`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('error_back_to_signin')}
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full border-primary/30 bg-secondary/50 text-foreground hover:bg-primary/20 hover:text-primary">
              <Link href={`/${locale}`}>
                <Home className="mr-2 h-4 w-4" />
                {t('error_back_to_home')}
              </Link>
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {t('error_contact_support')}{' '}
            <Link href="mailto:app@itusi.cn" className="text-primary hover:text-primary/80">
              {t('error_technical_support')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 