"use client"

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { SiGithub } from 'react-icons/si'
import { FcGoogle } from 'react-icons/fc'
import Link from 'next/link'
import Image from 'next/image'

interface SignInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignInDialog({ open, onOpenChange }: SignInDialogProps) {
  const locale = useLocale()
  const t = useTranslations("auth")
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const router = useRouter()

  // 根据语言环境构建正确的路径
  const getLocalizedPath = (path: string) => {
    return locale === "en" ? `/en${path}` : `/zh${path}`
  }

  // 保存当前页面路径到 sessionStorage
  const saveCurrentPath = () => {
    if (typeof window === 'undefined') return
    const currentPath = window.location.pathname
    const currentSearch = window.location.search

    // 排除登录和注册页面
    if (!currentPath.includes('/auth/signin') && !currentPath.includes('/auth/signup')) {
      sessionStorage.setItem('loginReturnPath', `${currentPath}${currentSearch}`)
    }
  }

  const resolveCallbackUrl = (options: { consume?: boolean } = {}) => {
    if (typeof window !== 'undefined') {
      const savedPath = sessionStorage.getItem('loginReturnPath')
      if (savedPath) {
        if (options.consume) {
          sessionStorage.removeItem('loginReturnPath')
        }
        return savedPath
      }

      // 2. 从 URL 参数获取
      const searchParams = new URLSearchParams(window.location.search)
      const callbackUrl = searchParams.get('callbackUrl')
      if (callbackUrl) {
        // 如果URL中有推荐码，保留它
        const referralCode = searchParams.get('referralCode')
        if (referralCode) {
          const url = new URL(callbackUrl, window.location.origin)
          url.searchParams.set('referralCode', referralCode)
          return url.pathname + url.search
        }
        return callbackUrl
      }

      // 3. 默认返回首页
      return getLocalizedPath('/')
    }
    return getLocalizedPath('/')
  }

  // 当对话框打开时，保存当前路径
  useEffect(() => {
    if (open) {
      saveCurrentPath()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(t('login_error'))
      } else {
        const callbackUrl = resolveCallbackUrl({ consume: true })
        onOpenChange(false)
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (error) {
      setError(t('login_failed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: string) => {
    setOauthLoading(provider)
    try {
      // 保存当前路径（如果还没有保存）
      saveCurrentPath()
      
      // 如果URL中有推荐码，存储到cookie中
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search)
        const referralCode = searchParams.get('referralCode')
        if (referralCode) {
          document.cookie = `oauth_referral_code=${referralCode}; path=/; max-age=600; SameSite=Lax`
        }
      }
      
      await signIn(provider, {
        callbackUrl: resolveCallbackUrl({ consume: true }),
      })
    } catch (error) {
      setError(t('login_failed'))
    } finally {
      setOauthLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:rounded-lg">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center shadow-lg border border-primary/30">
            <Image
              src="/logo.png"
              alt="MokerSaaS"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <DialogTitle className="text-2xl font-bold text-primary">
            {t('welcome_back')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t('login_description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {error && (
            <Alert className="border-red-500/30 bg-red-500/20">
              <AlertDescription className="text-red-300">{error}</AlertDescription>
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
              <span className="bg-background px-2 text-muted-foreground">
                {locale === "en" ? "Or continue with email" : "或使用邮箱登录"}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-email" className="text-foreground font-medium">{t('email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-4 w-4" />
                <Input
                  id="dialog-email"
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
              <Label htmlFor="dialog-password" className="text-foreground font-medium">{t('password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-4 w-4" />
                <Input
                  id="dialog-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('password_placeholder')}
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
            
            <div className="flex items-center justify-between">
              <Link
                href={getLocalizedPath('/auth/forgot-password')}
                className="text-sm text-primary hover:text-primary/80 font-medium"
                onClick={() => onOpenChange(false)}
              >
                {t('forgot_password')}
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-cyber-400 text-dark-900 font-medium py-2.5 transition-all duration-300 cyber-glow"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('logging_in')}
                </>
              ) : (
                <>
                  {t('login')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            {t('no_account')}{' '}
            <Link
              href={(() => {
                const callbackUrl = resolveCallbackUrl()
                return callbackUrl
                  ? `${getLocalizedPath('/auth/signup')}?callbackUrl=${encodeURIComponent(callbackUrl)}`
                  : getLocalizedPath('/auth/signup')
              })()}
              className="text-primary hover:text-primary/80 font-medium"
              onClick={() => onOpenChange(false)}
            >
              {t('signup_now')}
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

