"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CreditCard, 
  Crown, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  ExternalLink,
  RefreshCw,
  Building,
  User
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS, ja as jaLocale, ko as koLocale } from 'date-fns/locale'
import type { Locale as DateFnsLocale } from 'date-fns/locale'

const APP_DATE_FNS_LOCALE: Record<string, DateFnsLocale> = {
  'zh-CN': zhCN,
  'zh-TW': zhCN,
  ja: jaLocale,
  ko: koLocale,
}
function getDateFnsLocale(locale: string | undefined | null): DateFnsLocale {
  return APP_DATE_FNS_LOCALE[locale || ''] || enUS
}

const APP_INTL_LOCALE_TAG: Record<string, string> = {
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  ja: 'ja-JP',
  ko: 'ko-KR',
}
function getIntlLocaleTag(locale: string | undefined | null): string {
  return APP_INTL_LOCALE_TAG[locale || ''] || 'en-US'
}

interface SubscriptionData {
  subscriptionStatus: string | null
  subscriptionPlan: string | null
  subscriptionCurrentPeriodEnd: string | null
  stripeCustomerId: string | null
}

export function SubscriptionInfo() {
  const locale = useLocale()
  const t = useTranslations("profile")
  const { data: session, status } = useSession()
  
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [managingSubscription, setManagingSubscription] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchSubscriptionData()
    }
  }, [status, session])

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/user/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscriptionData(data)
      }
    } catch (error) {
      console.error('获取订阅信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchSubscriptionData()
    setRefreshing(false)
  }

  const handleManageSubscription = async () => {
    try {
      setManagingSubscription(true)

      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/${locale}/profile`
        })
      })

      if (response.ok) {
        const { url } = await response.json()
        window.open(url, '_blank')
      } else {
        const errorData = await response.json()
        console.error('Failed to create customer portal session:', errorData)
        alert(t('error.manage_subscription_failed'))
      }
    } catch (error) {
      console.error('Error creating customer portal session:', error)
      alert(t('error.manage_subscription_failed'))
    } finally {
      setManagingSubscription(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-primary/20 text-primary border-primary/50">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('subscription_active')}
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
            <XCircle className="h-3 w-3 mr-1" />
            {t('subscription_cancelled')}
          </Badge>
        )
      case 'past_due':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {t('subscription_past_due')}
          </Badge>
        )
      default:
        return (
          <Badge className="bg-secondary/50 text-muted-foreground border-dark-600">
            <User className="h-3 w-3 mr-1" />
            {t('subscription_free')}
          </Badge>
        )
    }
  }

  const getPlanIcon = (plan: string | null) => {
    switch (plan) {
      case 'trial':
        return <Crown className="h-5 w-5 text-primary/80" />
      case 'pro':
        return <Crown className="h-5 w-5 text-primary" />
      case 'annual':
        return <Crown className="h-5 w-5 text-primary" />
      case 'enterprise':
        return <Building className="h-5 w-5 text-primary/80" />
      default:
        return <User className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getPlanName = (plan: string | null) => {
    switch (plan) {
      case 'trial':
        return t('plan_trial')
      case 'pro':
        return t('plan_pro')
      case 'annual':
        return t('plan_annual')
      case 'enterprise':
        return t('plan_enterprise')
      default:
        return t('plan_free')
    }
  }

  const getPlanDescription = (plan: string | null) => {
    switch (plan) {
      case 'trial':
        return t('plan_trial_description')
      case 'pro':
        return t('plan_pro_description')
      case 'annual':
        return t('plan_annual_description')
      case 'enterprise':
        return t('plan_enterprise_description')
      default:
        return t('plan_free_description')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString(getIntlLocaleTag(locale), {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTimeToExpiry = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: getDateFnsLocale(locale)
    })
  }

  const isExpiringSoon = (dateString: string | null) => {
    if (!dateString) return false
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffInDays <= 7 && diffInDays > 0
  }

  const isExpired = (dateString: string | null) => {
    if (!dateString) return false
    const date = new Date(dateString)
    const now = new Date()
    return date.getTime() < now.getTime()
  }

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-secondary/80 backdrop-blur-sm cyber-glow-subtle">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-foreground">
            <CreditCard className="h-5 w-5 text-primary" />
            <span>{t('subscription_info')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-secondary/80 backdrop-blur-sm cyber-glow-subtle">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-foreground">
            <CreditCard className="h-5 w-5 text-primary" />
            <span>{t('subscription_info')}</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 px-3 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription className="text-muted-foreground">
          {t('subscription_info_description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 当前订阅状态 */}
        <div className="flex items-center justify-between p-4 bg-secondary/50 border border-primary/30 rounded-lg">
          <div className="flex items-center space-x-3">
            {getPlanIcon(subscriptionData?.subscriptionPlan || null)}
            <div>
              <p className="font-semibold text-foreground">
                {getPlanName(subscriptionData?.subscriptionPlan || null)}
              </p>
              <p className="text-sm text-muted-foreground">
                {getPlanDescription(subscriptionData?.subscriptionPlan || null)}
              </p>
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(subscriptionData?.subscriptionStatus || null)}
          </div>
        </div>

        {/* 订阅详情 */}
        {subscriptionData?.subscriptionPlan && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* 到期时间 */}
              {subscriptionData?.subscriptionCurrentPeriodEnd && (
                <div className="p-4 border border-primary/30 bg-secondary/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">{t('subscription_expires')}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-primary text-lg">
                        {formatDate(subscriptionData.subscriptionCurrentPeriodEnd)}
                        <span className="text-sm text-primary/80 ml-2 font-medium">
                          ({formatTimeToExpiry(subscriptionData.subscriptionCurrentPeriodEnd)})
                        </span>
                      </span>
                    </div>
                  </div>
                  {isExpiringSoon(subscriptionData.subscriptionCurrentPeriodEnd) && (
                    <div className="flex items-center space-x-1 mt-2 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm text-yellow-300 font-medium">{t('subscription_expiring_soon')}</span>
                    </div>
                  )}
                  {isExpired(subscriptionData.subscriptionCurrentPeriodEnd) && (
                    <div className="flex items-center space-x-1 mt-2 p-2 bg-red-500/20 border border-red-500/50 rounded">
                      <XCircle className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-red-300 font-medium">{t('subscription_expired')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 订阅管理按钮 */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              {subscriptionData?.subscriptionStatus === 'active' && (
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                  onClick={handleManageSubscription}
                  disabled={managingSubscription}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>{managingSubscription ? t('loading') : t('manage_subscription')}</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 