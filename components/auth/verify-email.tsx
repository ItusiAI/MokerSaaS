"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useApiError } from '@/hooks/use-api-error'

export function VerifyEmailPage() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations("verify")
  const tApi = useApiError()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [hasVerified, setHasVerified] = useState(false)
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  // 根据语言环境构建正确的路径
  const getLocalizedPath = (path: string) => {
    return `/${locale}${path}`
  }

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage(t('token_missing'))
      return
    }

    // 防止重复验证
    if (hasVerified) {
      return
    }

    const verifyEmail = async () => {
      try {
        setHasVerified(true)
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(
            data.messageKey ? tApi(data.messageKey) : (data.message || t('success'))
          )
        } else {
          setStatus('error')
          setMessage(
            data.errorKey ? tApi(data.errorKey) : (tApi(data.error) || t('failed'))
          )
        }
      } catch (error) {
        setStatus('error')
        setMessage(t('failed_retry'))
      }
    }

    verifyEmail()
  }, [token, hasVerified]) // 移除 t 依赖，添加 hasVerified 依赖

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 pt-24 pb-12">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-secondary/80 backdrop-blur-sm cyber-glow-subtle">
        <CardHeader className="text-center space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center ${
            status === 'loading' || status === 'success' || status === 'error'
              ? 'bg-primary cyber-glow'
              : 'bg-secondary shadow-lg border border-primary/30'
          }`}>
            {status === 'loading' && <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />}
            {status === 'success' && <CheckCircle className="w-8 h-8 text-primary-foreground" />}
            {status === 'error' && <XCircle className="w-8 h-8 text-primary-foreground" />}
            {!status && (
              <Image
                src="/logo.png"
                alt="MokerSaaS"
                width={48}
                height={48}
                className="object-contain"
              />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            {t('title')}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {status === 'loading' && t('verifying')}
            {status === 'success' && t('success')}
            {status === 'error' && t('failed')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {status === 'loading' && (
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">{t('please_wait')}</p>
            </div>
          )}

          {status === 'success' && (
            <Alert className="border-primary/30 bg-primary/20">
              <CheckCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary/80">{message}</AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert className="border-red-500/30 bg-red-500/20">
              <XCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">{message}</AlertDescription>
            </Alert>
          )}

          <div className="text-center space-y-4">
            {status === 'success' && (
              <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground cyber-glow">
                <Link href={getLocalizedPath("/auth/signin")}>
                  {t('login_now')}
                </Link>
              </Button>
            )}

            {status === 'error' && (
              <div className="space-y-3">
                <Button asChild variant="outline" className="w-full border-primary/30 bg-secondary/50 text-foreground hover:bg-primary/20 hover:text-primary">
                  <Link href={getLocalizedPath("/auth/signup")}>
                    {t('register_again')}
                  </Link>
                </Button>
                <div className="text-sm text-muted-foreground">
                  {t('or')}{' '}
                  <Link href={getLocalizedPath("/auth/signin")} className="text-primary hover:text-primary/80 font-medium">
                    {t('back_to_login')}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 