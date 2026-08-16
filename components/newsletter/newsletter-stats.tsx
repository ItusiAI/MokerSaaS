"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Mail, Globe, Calendar, RefreshCw, Download } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN, enUS, ja as jaLocale, ko as koLocale } from 'date-fns/locale'
import type { Locale as DateFnsLocale } from 'date-fns/locale'
import { useTranslations, useLocale } from 'next-intl'

const APP_DATE_FNS_LOCALE: Record<string, DateFnsLocale> = {
  zh: zhCN,
  ja: jaLocale,
  ko: koLocale,
}
function getDateFnsLocale(locale: string | undefined | null): DateFnsLocale {
  return APP_DATE_FNS_LOCALE[locale || ''] || enUS
}

interface Subscription {
  id: string
  email: string
  locale: string
  isActive: boolean
  subscribedAt: string
  unsubscribedAt: string | null
}

interface Stats {
  total: number
  zh: number
  en: number
  ja: number
  ko: number
  tw: number
}

const LOCALE_BADGE: Record<string, 'default' | 'secondary' | 'outline'> = {
  zh: 'default',
  tw: 'default',
  ja: 'secondary',
  ko: 'outline',
  en: 'secondary',
}

function languageDisplayName(locale: string, t: ReturnType<typeof useTranslations<string>>): string {
  switch (locale) {
    case 'zh':
      return t('subscription_list.table.chinese')
    case 'tw':
      return t('subscription_list.table.traditionalChinese')
    case 'ja':
      return t('subscription_list.table.japanese')
    case 'ko':
      return t('subscription_list.table.korean')
    default:
      return t('subscription_list.table.english')
  }
}

export function NewsletterStats() {
  const t = useTranslations('admin.newsletter')
  const locale = useLocale()
  const [stats, setStats] = useState<Stats | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/newsletter/subscribe?action=stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(t('error.fetch_stats_failed'))
      console.error('Error fetching stats:', err)
    }
  }

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/newsletter/subscribe?action=list')
      if (!response.ok) throw new Error('Failed to fetch subscriptions')
      const data = await response.json()
      setSubscriptions(data.subscriptions)
    } catch (err) {
      setError(t('error.fetch_subscriptions_failed'))
      console.error('Error fetching subscriptions:', err)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    await Promise.all([fetchStats(), fetchSubscriptions()])
    setLoading(false)
  }

  const handleExport = async (type: 'active' | 'inactive' | 'all') => {
    try {
      let dataToExport: Subscription[]

      if (type === 'active') {
        dataToExport = activeSubscriptions
      } else if (type === 'inactive') {
        dataToExport = inactiveSubscriptions
      } else {
        dataToExport = subscriptions
      }

      if (dataToExport.length === 0) {
        alert(t('subscription_list.no_data'))
        return
      }

      const csvHeader =
        locale === 'zh' || locale === 'tw'
          ? '邮箱地址,语言,状态,订阅时间,取消订阅时间\n'
          : locale === 'ja'
          ? 'メールアドレス,言語,ステータス,購読日時,配信停止日時\n'
          : locale === 'ko'
          ? '이메일 주소,언어,상태,구독 시간,구독 해지 시간\n'
          : 'Email Address,Language,Status,Subscribed At,Unsubscribed At\n'

      const csvContent = dataToExport
        .map((sub) => {
          const language = languageDisplayName(sub.locale, t)
          const status = sub.isActive
            ? locale === 'zh' || locale === 'tw'
              ? '活跃'
              : locale === 'ja'
              ? 'アクティブ'
              : locale === 'ko'
              ? '활성'
              : 'Active'
            : locale === 'zh' || locale === 'tw'
            ? '已取消'
            : locale === 'ja'
            ? 'キャンセル済み'
            : locale === 'ko'
            ? '취소됨'
            : 'Cancelled'
          const subscribedAt = format(
            new Date(sub.subscribedAt),
            (locale === 'zh' || locale === 'tw' || locale === 'ja' || locale === 'ko') ? 'yyyy年MM月dd日 HH:mm' : 'MMM dd, yyyy HH:mm',
            { locale: getDateFnsLocale(locale) }
          )
          const unsubscribedAt = sub.unsubscribedAt
            ? format(
                new Date(sub.unsubscribedAt),
                (locale === 'zh' || locale === 'tw' || locale === 'ja' || locale === 'ko') ? 'yyyy年MM月dd日 HH:mm' : 'MMM dd, yyyy HH:mm',
                { locale: getDateFnsLocale(locale) }
              )
            : '-'

          return `"${sub.email}","${language}","${status}","${subscribedAt}","${unsubscribedAt}"`
        })
        .join('\n')

      const csv = csvHeader + csvContent
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const timestamp = format(new Date(), 'yyyyMMdd_HHmmss')
      link.download = `newsletter_subscriptions_${type}_${timestamp}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      alert(t('subscription_list.export_failed'))
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const activeSubscriptions = subscriptions.filter((sub) => sub.isActive)
  const inactiveSubscriptions = subscriptions.filter((sub) => !sub.isActive)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('actions.retry')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.total_subscriptions')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.active_subscribers')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.chinese_subscriptions')}</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.zh || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.chinese_users')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.english_subscriptions')}</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.en || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.english_users')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.japanese_subscriptions')}</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.ja || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.japanese_users')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.korean_subscriptions')}</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.ko || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.korean_users')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.traditional_chinese_subscriptions')}</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tw || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.traditional_chinese_users')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 订阅列表 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('subscription_list.title')}</CardTitle>
            <CardDescription>{t('subscription_list.description')}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleExport('all')} variant="outline" size="sm" disabled={subscriptions.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              {t('subscription_list.export')}
            </Button>
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('actions.refresh')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">
                {t('subscription_list.active_tab')} ({activeSubscriptions.length})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                {t('subscription_list.inactive_tab')} ({inactiveSubscriptions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              <SubscriptionTable subscriptions={activeSubscriptions} t={t} locale={locale} />
            </TabsContent>

            <TabsContent value="inactive" className="space-y-4">
              <SubscriptionTable subscriptions={inactiveSubscriptions} t={t} locale={locale} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function SubscriptionTable({
  subscriptions,
  t,
  locale,
}: {
  subscriptions: Subscription[]
  t: any
  locale: string
}) {
  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('subscription_list.no_data')}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('subscription_list.table.email')}</TableHead>
            <TableHead>{t('subscription_list.table.language')}</TableHead>
            <TableHead>{t('subscription_list.table.status')}</TableHead>
            <TableHead>{t('subscription_list.table.subscribed_at')}</TableHead>
            <TableHead>{t('subscription_list.table.unsubscribed_at')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((subscription) => (
            <TableRow key={subscription.id}>
              <TableCell className="font-medium">
                {subscription.email}
              </TableCell>
              <TableCell>
                <Badge variant={LOCALE_BADGE[subscription.locale] || 'secondary'}>
                  {languageDisplayName(subscription.locale, t)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={subscription.isActive ? 'default' : 'destructive'}>
                  {subscription.isActive ? t('subscription_list.table.active') : t('subscription_list.table.cancelled')}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  {format(
                    new Date(subscription.subscribedAt),
                    (locale === 'zh' || locale === 'tw' || locale === 'ja' || locale === 'ko') ? 'yyyy年MM月dd日' : 'MMM dd, yyyy',
                    { locale: getDateFnsLocale(locale) }
                  )}
                </div>
              </TableCell>
              <TableCell>
                {subscription.unsubscribedAt ? (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    {format(
                      new Date(subscription.unsubscribedAt),
                      (locale === 'zh' || locale === 'tw' || locale === 'ja' || locale === 'ko') ? 'yyyy年MM月dd日' : 'MMM dd, yyyy',
                      { locale: getDateFnsLocale(locale) }
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}