"use client"

import { useSearchParams, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, Home, ArrowLeft, Info } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

export function AuthError() {
  const searchParams = useSearchParams()
  const params = useParams()
  const locale = params.locale as string
  const error = searchParams.get('error')
  const t = useTranslations('auth')

  const getErrorMessage = (error: string | null) => {
    if (!error) return t('errors.default')
    
    // 检查是否有对应的错误翻译键
    const errorKey = `errors.${error}` as any
    try {
      return t(errorKey)
    } catch {
      return t('errors.default')
    }
  }

  const getErrorDetails = (error: string | null) => {
    if (!error) return null
    
    const errorDetails: { [key: string]: string } = {
      'OAuthSignin': locale === 'zh' ? 
        '第三方登录失败，可能的原因：\n1. 网络连接问题\n2. 第三方服务暂时不可用\n3. 应用配置问题' :
        'Third-party sign in failed, possible reasons:\n1. Network connection issue\n2. Third-party service temporarily unavailable\n3. Application configuration issue',
      'OAuthCallback': locale === 'zh' ?
        '第三方登录回调失败，可能的原因：\n1. 回调URL配置错误\n2. 授权码已过期\n3. 第三方服务响应异常' :
        'Third-party sign in callback failed, possible reasons:\n1. Callback URL configuration error\n2. Authorization code expired\n3. Third-party service response error',
      'OAuthCreateAccount': locale === 'zh' ?
        '无法创建账户，可能的原因：\n1. 该第三方账户已关联其他账户\n2. 数据库连接问题\n3. 用户信息获取失败' :
        'Cannot create account, possible reasons:\n1. This third-party account is already linked to another account\n2. Database connection issue\n3. Failed to retrieve user information',
      'Configuration': locale === 'zh' ?
        '服务器配置错误，请联系管理员检查：\n1. 环境变量配置\n2. 数据库连接\n3. 第三方应用配置' :
        'Server configuration error, please contact administrator to check:\n1. Environment variables\n2. Database connection\n3. Third-party application configuration'
    }
    
    return errorDetails[error] || null
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

          {/* 开发环境下显示详细错误信息 */}
          {process.env.NODE_ENV === 'development' && error && (
            <Alert className="border-primary/30 bg-primary/20">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary/80">
                <div className="space-y-2">
                  <div className="font-semibold">错误类型: {error}</div>
                  {getErrorDetails(error) && (
                    <div className="text-sm whitespace-pre-line">
                      {getErrorDetails(error)}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

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