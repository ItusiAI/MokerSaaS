"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, CheckCircle, XCircle } from 'lucide-react'

type Source = 'newsletter' | 'subscription'

interface UnsubscribeFormProps {
  source?: Source
}

/**
 * 通用退订表单
 *  - source='newsletter'  → 退订营销邮件(原有逻辑)
 *  - source='subscription' → 退订订阅到期提醒(新)
 *
 *  - 邮件链接点击 → API GET 重定向 → 落地本页 → 直接显示成功状态
 *  - subscription 流程:页面上有"恢复订阅提醒"按钮(POST action='resubscribe')
 *  - newsletter 流程:邮箱输入框(POST email)
 */
export function UnsubscribeForm({ source = 'newsletter' }: UnsubscribeFormProps) {
  const locale = useLocale()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')

  const tNs = useTranslations(
    source === 'subscription'
      ? 'subscription.reminder.unsubscribe'
      : 'newsletter.unsubscribe',
  )

  const apiBase =
    source === 'subscription'
      ? '/api/unsubscribe-subscription'
      : '/api/newsletter/unsubscribe'

  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorKey, setErrorKey] = useState<'invalid' | 'network' | null>(null)

  // 落地页有 token → 视为"邮件刚点过链接,退订已成功"
  useEffect(() => {
    if (token) {
      setIsSuccess(true)
      setMessage(tNs('successFromEmail'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // subscription 流程:恢复订阅提醒
  const handleResubscribe = async () => {
    if (!token) return
    setIsLoading(true)
    setErrorKey(null)
    try {
      const response = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'resubscribe', locale }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setIsSuccess(false)
        setMessage(data.message)
      } else {
        setErrorKey('invalid')
        setMessage(data.error ?? tNs('unsubscribeError'))
      }
    } catch (error) {
      setErrorKey('network')
    } finally {
      setIsLoading(false)
    }
  }

  // newsletter 流程:邮箱输入退订
  const handleUnsubscribeWithEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsLoading(true)
    setErrorKey(null)
    try {
      const response = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      })
      const data = await response.json()
      if (response.ok) {
        setIsSuccess(true)
        setMessage(data.message ?? tNs('successMessage'))
        setEmail('')
      } else {
        setErrorKey('invalid')
        setMessage(data.error ?? '')
      }
    } catch (error) {
      setErrorKey('network')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToHome = () => {
    window.location.href = `/${locale}`
  }

  const showErrorBlock = errorKey && !isLoading

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-slate-800">
          {tNs('title')}
        </CardTitle>
        <CardDescription>{tNs('description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-slate-600">{tNs('loadingText')}</p>
          </div>
        )}

        {!isLoading && !showErrorBlock && message && (
          <div
            className={`text-center p-4 rounded-lg ${
              isSuccess
                ? 'text-green-700 bg-green-50 border border-green-200'
                : 'text-blue-700 bg-blue-50 border border-blue-200'
            }`}
          >
            <div className="flex items-center justify-center mb-2">
              <CheckCircle
                className={`h-6 w-6 ${isSuccess ? 'text-green-600' : 'text-blue-600'}`}
              />
            </div>
            <p>{message}</p>
          </div>
        )}

        {showErrorBlock && (
          <div className="text-center p-4 rounded-lg text-red-700 bg-red-50 border border-red-200">
            <div className="flex items-center justify-center mb-2">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <p>{errorKey === 'network' ? tNs('networkError') : message || tNs('unsubscribeError')}</p>
          </div>
        )}

        {/* newsletter 流程:邮箱输入退订 */}
        {source === 'newsletter' && !token && !isSuccess && !isLoading && (
          <form onSubmit={handleUnsubscribeWithEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {tNs('emailLabel')}
              </label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder={tNs('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-coral-600 hover:bg-coral-700"
              disabled={isLoading}
            >
              {isLoading ? tNs('processing') : tNs('button')}
            </Button>
          </form>
        )}

        {/* subscription 流程:已退订用户可恢复 */}
        {source === 'subscription' && token && isSuccess && !isLoading && (
          <div className="text-center space-y-4">
            <Button
              onClick={handleResubscribe}
              variant="outline"
              className="border-coral-200 text-coral-700 hover:bg-coral-50"
              disabled={isLoading}
            >
              {tNs('resubscribeButton')}
            </Button>
          </div>
        )}

        {(isSuccess || (source === 'subscription' && token && message)) && !showErrorBlock && (
          <div className="text-center space-y-2">
            <Button
              onClick={handleBackToHome}
              variant="outline"
              className="border-coral-200 text-coral-700 hover:bg-coral-50"
            >
              {tNs('backToHome')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}