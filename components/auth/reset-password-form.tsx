"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, ArrowLeft, CheckCircle, XCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useApiError } from '@/hooks/use-api-error'

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const t = useTranslations("reset_password")
  const tApi = useApiError()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [token, setToken] = useState<string | null>(null)

  // 根据语言环境构建正确的路径
  const getLocalizedPath = (path: string) => {
    return `/${locale}${path}`
  }

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      setStatus('error')
      setMessage(t('token_invalid'))
    } else {
      setToken(tokenParam)
    }
  }, [searchParams, t])

  const validatePassword = (password: string) => {
    return password.length >= 6
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password) {
      setStatus('error')
      setMessage(t('password_required'))
      return
    }

    if (!validatePassword(password)) {
      setStatus('error')
      setMessage(t('password_min_length'))
      return
    }

    if (password !== confirmPassword) {
      setStatus('error')
      setMessage(t('password_mismatch'))
      return
    }

    if (!token) {
      setStatus('error')
      setMessage(t('token_invalid'))
      return
    }

    setIsLoading(true)
    setStatus('idle')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.messageKey ? tApi(data.messageKey) : t('success_message'))
      } else {
        setStatus('error')
        setMessage(
          data.errorKey ? tApi(data.errorKey) : (tApi(data.error) || t('reset_failed'))
        )
      }
    } catch (error) {
      setStatus('error')
      setMessage(t('reset_failed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 pt-24 pb-12">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-secondary/80 backdrop-blur-sm cyber-glow-subtle">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center shadow-lg border border-primary/30">
            <Image
              src="/logo.png"
              alt="MokerSaaS"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            {t('title')}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('description')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {status === 'success' ? (
            <div className="text-center space-y-4">
              <Alert className="border-primary/30 bg-primary/20">
                <CheckCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-primary/80">
                  {message}
                </AlertDescription>
              </Alert>
              <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground cyber-glow">
                <Link href={getLocalizedPath("/auth/signin")}>
                  {t('login_now')}
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">{t('password_label')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('password_placeholder')}
                    className="bg-secondary/50 border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-primary" />
                    ) : (
                      <Eye className="h-4 w-4 text-primary" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">{t('confirm_password_label')}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('confirm_password_placeholder')}
                    className="bg-secondary/50 border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-primary" />
                    ) : (
                      <Eye className="h-4 w-4 text-primary" />
                    )}
                  </Button>
                </div>
              </div>

              {status === 'error' && (
                <Alert className="border-red-500/30 bg-red-500/20">
                  <XCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300">
                    {message}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 cyber-glow"
                disabled={isLoading || !token}
              >
                {isLoading ? t('resetting') : t('reset_password')}
              </Button>

              <div className="text-center">
                <Link
                  href={getLocalizedPath("/auth/forgot-password")}
                  className="text-muted-foreground hover:text-primary text-sm font-medium inline-flex items-center"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  {t('back_to_forgot')}
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 