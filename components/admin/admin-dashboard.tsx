"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  BarChart3,
  UserCog,
  MailOpen,
  Mail,
  Gift,
  TrendingUp,
  DollarSign,
  Coins,
  UserPlus,
  Award,
  CreditCard,
  Wallet,
  Loader2,
  UserMinus,
  Rocket,
} from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { UserStats } from './user-stats'
import { NewsletterStats } from '../newsletter/newsletter-stats'
import { ReferralManagement } from './referral-management'
import { AffiliateManagement } from './affiliate-management'
import { TrafficAnalytics } from './traffic-analytics'
import { ReminderLogs } from './reminder-logs'
import { ReengagementList } from './reengagement-list'
import { ReengagementCampaigns } from './reengagement-campaigns'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type AdminSection = 'overview' | 'users' | 'newsletter' | 'referral' | 'affiliate' | 'traffic' | 'reminders' | 'reengagement' | 'reengagement-campaigns'

interface MenuItem {
  id: AdminSection
  label: string
  icon: React.ReactNode
  description: string
}

export function AdminDashboard() {
  const t = useTranslations('admin.dashboard')
  
  // 始终使用固定默认值，sessionStorage 的读取放在 useEffect（CSR 阶段）中进行
  // 这样服务器和客户端首次渲染都输出相同内容，避免 hydration mismatch
  const [activeSection, setActiveSection] = useState<AdminSection>('overview')
  const [hydrated, setHydrated] = useState(false)

  // 挂载后从 sessionStorage 恢复（仅在 CSR 阶段运行，不影响 SSR 结果）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '')
      if (hash && ['newsletter', 'users', 'overview', 'referral', 'affiliate', 'traffic', 'reminders', 'reengagement', 'reengagement-campaigns'].includes(hash)) {
        setActiveSection(hash as AdminSection)
      } else {
        const saved = sessionStorage.getItem('adminActiveSection')
        if (saved && ['newsletter', 'users', 'overview', 'referral', 'affiliate', 'traffic', 'reminders', 'reengagement', 'reengagement-campaigns'].includes(saved)) {
          setActiveSection(saved as AdminSection)
        }
      }
    }
    setHydrated(true)
  }, [])

  // 同步到 sessionStorage
  useEffect(() => {
    if (hydrated && typeof window !== 'undefined') {
      sessionStorage.setItem('adminActiveSection', activeSection)
    }
  }, [activeSection, hydrated])

  // 浏览器前进/后退时同步
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash && ['newsletter', 'users', 'overview', 'referral', 'affiliate', 'traffic', 'reminders', 'reengagement', 'reengagement-campaigns'].includes(hash)) {
        setActiveSection(hash as AdminSection)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const menuItems: MenuItem[] = [
    {
      id: 'overview',
      label: t('menu.overview'),
      icon: <BarChart3 className="h-5 w-5" />,
      description: t('menu.overview_desc')
    },
    {
      id: 'traffic',
      label: t('menu.traffic'),
      icon: <BarChart3 className="h-5 w-5" />,
      description: t('menu.traffic_desc')
    },
    {
      id: 'users',
      label: t('menu.users'),
      icon: <UserCog className="h-5 w-5" />,
      description: t('menu.users_desc')
    },
    {
      id: 'referral',
      label: t('menu.referral'),
      icon: <Gift className="h-5 w-5" />,
      description: t('menu.referral_desc')
    },
    {
      id: 'affiliate',
      label: t('menu.affiliate'),
      icon: <TrendingUp className="h-5 w-5" />,
      description: t('menu.affiliate_desc')
    },
    {
      id: 'newsletter',
      label: t('menu.newsletter'),
      icon: <MailOpen className="h-5 w-5" />,
      description: t('menu.newsletter_desc')
    },
    {
      id: 'reminders',
      label: t('menu.reminders'),
      icon: <Mail className="h-5 w-5" />,
      description: t('menu.reminders_desc')
    },
    {
      id: 'reengagement',
      label: t('menu.reengagement'),
      icon: <UserMinus className="h-5 w-5" />,
      description: t('menu.reengagement_desc')
    },
    {
      id: 'reengagement-campaigns',
      label: t('menu.reengagement_campaigns'),
      icon: <Rocket className="h-5 w-5" />,
      description: t('menu.reengagement_campaigns_desc')
    }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <AdminOverview />
      case 'users':
        return <UserStats />
      case 'referral':
        return <ReferralManagement />
      case 'affiliate':
        return <AffiliateManagement />
      case 'newsletter':
        return <NewsletterStats />
      case 'traffic':
        return <TrafficAnalytics />
      case 'reminders':
        return <ReminderLogs />
      case 'reengagement':
        return <ReengagementList />
      case 'reengagement-campaigns':
        return <ReengagementCampaigns />
      default:
        return <AdminOverview />
    }
  }

  return (
    <div className="space-y-6">
      {/* 顶部导航标签 */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? 'default' : 'outline'}
                size="sm"
                className="flex items-center gap-2"
                onClick={() => {
                  setActiveSection(item.id)
                  if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', `${window.location.pathname}#${item.id}`)
                  }
                }}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 内容区域 */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-4">
            <h1 className="text-xl font-semibold">
              {menuItems.find(item => item.id === activeSection)?.label}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {menuItems.find(item => item.id === activeSection)?.description}
            </p>
          </div>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  )
}

interface OverviewStats {
  totalUsers: number
  subscribedUsers: number
  subscriptionRevenue: number
  pointsPurchaseRevenue: number
  totalPoints: number
  totalReferrals: number
  referralSubscribedCount: number
  referralRewardPoints: number
  affiliateCount: number
  affiliateTotalEarnings: number
  affiliateTotalWithdrawals: number
  newsletterSubscribers: number
}

interface TrendsData {
  registrationTrends: Array<{ date: string; count: number }>
  subscriptionTrends: Array<{ date: string; count: number; revenue: number }>
  revenueTrends: Array<{ date: string; revenue: number }>
}

function AdminOverview() {
  const t = useTranslations('admin.dashboard')
  const locale = useLocale()
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [trends, setTrends] = useState<TrendsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [trendsLoading, setTrendsLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchStats()
    fetchTrends()
  }, [])

  useEffect(() => {
    fetchTrends()
  }, [days])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/statistics?type=overview')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrends = async () => {
    setTrendsLoading(true)
    try {
      const response = await fetch(`/api/admin/statistics?type=trends&days=${days}`)
      if (response.ok) {
        const data = await response.json()
        setTrends(data)
      }
    } catch (error) {
      console.error('获取趋势数据失败:', error)
    } finally {
      setTrendsLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US')
  }

  // 格式化日期显示（中文/日文/韩文使用本地格式，英文使用 en-US）
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      if ((locale === 'zh' || locale === 'tw' || locale === 'ja' || locale === 'ko')) {
        const tag = locale === 'zh' || locale === 'tw' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : 'ko-KR'
        return date.toLocaleDateString(tag, { month: 'long', day: 'numeric' })
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 - 分类展示 */}
      <div className="space-y-6">
        {/* 用户与收入 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">{t('overview.categories.users_revenue')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('overview.stats.total_users')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats?.totalUsers || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('overview.stats.subscribed_users')}</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats?.subscribedUsers || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('overview.stats.subscription_revenue')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats?.subscriptionRevenue || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('overview.stats.points_revenue')}</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats?.pointsPurchaseRevenue || 0)}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 推荐与推广 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">{t('overview.categories.referral_affiliate')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('overview.stats.total_referrals')}</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats?.totalReferrals || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('overview.stats.referral_subscribed')}</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats?.referralSubscribedCount || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('overview.stats.referral_reward_points')}</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats?.referralRewardPoints || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('overview.stats.affiliate_count')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats?.affiliateCount || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('overview.stats.affiliate_earnings')}</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats?.affiliateTotalEarnings || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('overview.stats.affiliate_withdrawals')}</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats?.affiliateTotalWithdrawals || 0)}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 趋势图表 */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('overview.trends.title')}</h3>
          <div className="flex gap-2">
            <Button
              variant={days === 7 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(7)}
            >
              {t('overview.trends.days_7')}
            </Button>
            <Button
              variant={days === 30 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(30)}
            >
              {t('overview.trends.days_30')}
            </Button>
            <Button
              variant={days === 90 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(90)}
            >
              {t('overview.trends.days_90')}
            </Button>
          </div>
        </div>

        {trendsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* 注册人数趋势 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">{t('overview.trends.registration')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends?.registrationTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                    />
                    <YAxis />
                    <Tooltip labelFormatter={formatDate} />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" name={t('overview.trends.registration_count')} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 订阅数和收入趋势 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">{t('overview.trends.subscription')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trends?.subscriptionTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      tickFormatter={(value) => `$${(value / 100).toFixed(0)}`}
                    />
                    <Tooltip 
                      labelFormatter={formatDate}
                      formatter={(value: number, name: string) => {
                        if (name === 'revenue' || name === t('overview.trends.subscription_revenue')) {
                          return formatCurrency(value)
                        }
                        return value
                      }} 
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" fill="#8884d8" name={t('overview.trends.subscription_count')} />
                    <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name={t('overview.trends.subscription_revenue')} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 总收入趋势 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">{t('overview.trends.total_revenue')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends?.revenueTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                    />
                    <YAxis tickFormatter={(value) => `$${(value / 100).toFixed(0)}`} />
                    <Tooltip 
                      labelFormatter={formatDate}
                      formatter={(value: number) => formatCurrency(value)} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name={t('overview.trends.revenue')} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

