"use client"

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, CheckCircle, Gift } from 'lucide-react'
import { SiGithub } from 'react-icons/si'
import { FcGoogle } from 'react-icons/fc'
import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { setAffiliateCookie } from '@/lib/utils'

export function SignUpForm() {
  const locale = useLocale()
  const t = useTranslations("auth")
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [affiliateCode, setAffiliateCode] = useState('')
  const [showReferralInput, setShowReferralInput] = useState(false)
  const [showAffiliateInput, setShowAffiliateInput] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const router = useRouter()

  // 从URL参数中读取邀请码并自动填充
  useEffect(() => {
    const refCode = searchParams.get('ref') || searchParams.get('referralCode') || searchParams.get('code')
    const affCode = searchParams.get('aff')
    
    // 如果有推荐码参数，显示推荐码输入框并填充
    if (refCode) {
      setShowReferralInput(true)
      setReferralCode(refCode)
    }
    
    // 如果有推广返利码参数，显示推广码输入框并填充，同时设置Cookie
    if (affCode) {
      setShowAffiliateInput(true)
      setAffiliateCode(affCode)
      setAffiliateCookie(affCode)
    }
  }, [searchParams])

  // 根据语言环境构建正确的路径
  const getLocalizedPath = (path: string) => {
    return locale === "en" ? `/en${path}` : `/zh${path}`
  }

  // 获取回调URL
  const getCallbackUrl = () => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      return searchParams.get('callbackUrl')
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    // 验证密码
    if (password !== confirmPassword) {
      setError(t('password_mismatch'))
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError(t('password_too_short'))
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          locale, 
          referralCode: showReferralInput ? (referralCode.trim() || undefined) : undefined 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.messageKey ? t(data.messageKey) : (data.message || t('register_success')))
        // 3秒后跳转到登录页
        setTimeout(() => {
          const callbackUrl = getCallbackUrl()
          const signinUrl = callbackUrl
            ? `${getLocalizedPath('/auth/signin')}?callbackUrl=${encodeURIComponent(callbackUrl)}`
            : getLocalizedPath('/auth/signin')
          router.push(signinUrl)
        }, 3000)
      } else {
        setError(
          data.errorKey ? t(data.errorKey) : (data.error || t('register_failed'))
        )
      }
    } catch (error) {
      setError(t('register_retry'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: string) => {
    setOauthLoading(provider)
    try {
      // 如果有推荐码，存储到cookie中，以便在OAuth回调后处理
      if (showReferralInput && referralCode.trim()) {
        document.cookie = `oauth_referral_code=${referralCode.trim()}; path=/; max-age=600; SameSite=Lax`
      }
      
      // 如果有推广返利码，确保已设置到Cookie
      if (showAffiliateInput && affiliateCode.trim()) {
        setAffiliateCookie(affiliateCode.trim())
      }
      
      await signIn(provider, {
        callbackUrl: getLocalizedPath('/'),
      })
    } catch (error) {
      setError(t('register_failed'))
    } finally {
      setOauthLoading(null)
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
            {t('create_account')}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('signup_description')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-500/30 bg-red-500/20">
              <AlertDescription className="text-red-300">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-primary/30 bg-primary/20">
              <CheckCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary/80">{success}</AlertDescription>
            </Alert>
          )}

          {/* 第三方登录按钮 */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center space-x-2 border-primary/30 bg-secondary/50 text-foreground hover:bg-primary/20 hover:text-primary"
                onClick={() => handleOAuthSignIn('github')}
                disabled={oauthLoading !== null}
              >
                {oauthLoading === 'github' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <SiGithub className="h-4 w-4 text-[#181717] dark:invert" />
                )}
                <span>GitHub</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center space-x-2 border-primary/30 bg-secondary/50 text-foreground hover:bg-primary/20 hover:text-primary"
                onClick={() => handleOAuthSignIn('google')}
                disabled={oauthLoading !== null}
              >
                {oauthLoading === 'google' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <FcGoogle className="h-4 w-4" />
                )}
                <span>Google</span>
              </Button>
            </div>
          </div>

          {/* 分割线 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-primary/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-secondary px-2 text-muted-foreground">
                {t('or_register_with_email')}
              </span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground font-medium">{t('name')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-4 w-4" />
                <Input
                  id="name"
                  type="text"
                  placeholder={t('name_placeholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-secondary/50 border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">{t('email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t('email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-secondary/50 border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">{t('password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('password_signup_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-secondary/50 border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary/80"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground font-medium">{t('confirm_password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-4 w-4" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('confirm_password_placeholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 bg-secondary/50 border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary/80"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 推荐码输入框 - 仅当URL有ref参数时显示 */}
            {showReferralInput && (
              <div className="space-y-2">
                <Label htmlFor="referralCode" className="text-foreground font-medium">
                  {t('referral_code')}
                </Label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-4 w-4" />
                  <Input
                    id="referralCode"
                    type="text"
                    placeholder={t('referral_code_placeholder')}
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="pl-10 bg-secondary/50 border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                    maxLength={20}
                  />
                </div>
              </div>
            )}

            {/* 推广码输入框 - 仅当URL有aff参数时显示 */}
            {showAffiliateInput && (
              <div className="space-y-2">
                <Label htmlFor="affiliateCode" className="text-foreground font-medium">
                  {t('affiliate_code')}
                </Label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-4 w-4" />
                  <Input
                    id="affiliateCode"
                    type="text"
                    placeholder={t('affiliate_code_placeholder')}
                    value={affiliateCode}
                    onChange={(e) => setAffiliateCode(e.target.value)}
                    className="pl-10 bg-secondary/50 border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                    maxLength={20}
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || success !== ''}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 transition-all duration-300 cyber-glow"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('registering')}
                </>
              ) : success ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {t('register_success')}
                </>
              ) : (
                <>
                  {t('create_account')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          
          <div className="text-center text-sm text-muted-foreground">
            {t('terms_agreement')}{' '}
            <Link
              href={locale === "en" ? "/en/terms" : "/zh/terms"}
              className="text-primary hover:text-primary/80 font-medium"
            >
              {t('terms_of_service')}
            </Link>
            {' '}{t('and')}{' '}
            <Link
              href={locale === "en" ? "/en/privacy" : "/zh/privacy"}
              className="text-primary hover:text-primary/80 font-medium"
            >
              {t('privacy_policy')}
            </Link>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {t('has_account')}{' '}
            <Link
              href={(() => {
                const callbackUrl = getCallbackUrl()
                return callbackUrl
                  ? `${getLocalizedPath('/auth/signin')}?callbackUrl=${encodeURIComponent(callbackUrl)}`
                  : getLocalizedPath('/auth/signin')
              })()}
              className="text-primary hover:text-primary/80 font-medium"
            >
              {t('login_now')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 