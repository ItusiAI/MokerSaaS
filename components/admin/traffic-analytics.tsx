"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Users,
  Eye,
  MousePointerClick,
  Globe,
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface UmamiStats {
  pageviews: { value: number; change: number }
  visitors: { value: number; change: number }
  visits: { value: number; change: number }
  bounces: { value: number; change: number }
  totaltime: { value: number; change: number }
}

interface UmamiMetrics {
  url: { x: string; y: number }[]
  referrer: { x: string; y: number }[]
  browser: { x: string; y: number }[]
  os: { x: string; y: number }[]
  device: { x: string; y: number }[]
  country: { x: string; y: number }[]
  language: { x: string; y: number }[]
}

interface UmamiPageviews {
  pageviews: { t: string; y: number }[]
  sessions: { t: string; y: number }[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D']

export function TrafficAnalytics() {
  const t = useTranslations('admin.traffic')
  const [stats, setStats] = useState<UmamiStats | null>(null)
  const [metrics, setMetrics] = useState<UmamiMetrics | null>(null)
  const [pageviews, setPageviews] = useState<UmamiPageviews | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(7)
  const [isConfigured, setIsConfigured] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [days])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/admin/analytics/umami?days=${days}`)
      
      if (response.status === 503) {
        setIsConfigured(false)
        setLoading(false)
        return
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      
      const data = await response.json()
      setStats(data.stats)
      setMetrics(data.metrics)
      setPageviews(data.pageviews)
      setIsConfigured(true)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(t('error_message'))
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('not_configured.title')}</AlertTitle>
          <AlertDescription className="mt-2 space-y-4">
            <p>{t('not_configured.description')}</p>

            {/* 前端追踪配置 */}
            <div>
              <p className="text-sm font-semibold mb-2">{t('not_configured.frontend_tracking')}</p>
              <div className="p-4 bg-muted rounded-md space-y-1">
                <p className="text-sm font-mono">NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id</p>
                <p className="text-sm font-mono">NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js</p>
              </div>
            </div>

            {/* 后端 API 配置 */}
            <div>
              <p className="text-sm font-semibold mb-2">{t('not_configured.backend_api')}</p>
              <div className="p-4 bg-muted rounded-md space-y-1">
                <p className="text-sm font-mono">UMAMI_API_URL=https://cloud.umami.is/api</p>
              </div>
            </div>

            {/* 认证配置 */}
            <div>
              <p className="text-sm font-semibold mb-2">{t('not_configured.authentication')}</p>

              {/* Umami Cloud */}
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1">{t('not_configured.umami_cloud')}</p>
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm font-mono">UMAMI_API_KEY=your-api-key</p>
                </div>
              </div>

              {/* 自部署 Umami */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t('not_configured.self_hosted')}</p>
                <div className="p-4 bg-muted rounded-md space-y-1">
                  <p className="text-sm font-mono">UMAMI_USERNAME=admin</p>
                  <p className="text-sm font-mono">UMAMI_PASSWORD=your-password</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" asChild>
                <a href="https://umami.is" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('not_configured.learn_more')}
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('error_title')}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex gap-2">
        <Button variant={days === 7 ? 'default' : 'outline'} size="sm" onClick={() => setDays(7)}>
          {t('days_7')}
        </Button>
        <Button variant={days === 30 ? 'default' : 'outline'} size="sm" onClick={() => setDays(30)}>
          {t('days_30')}
        </Button>
        <Button variant={days === 90 ? 'default' : 'outline'} size="sm" onClick={() => setDays(90)}>
          {t('days_90')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.pageviews')}</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.pageviews.value || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.visitors')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.visitors.value || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.visits')}</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.visits.value || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.bounce_rate')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.pageviews.value ? Math.round((stats.bounces.value / stats.pageviews.value) * 100) : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.avg_time')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(stats?.totaltime.value || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pageviews Chart */}
      {pageviews && pageviews.pageviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('charts.pageviews_trend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={pageviews.pageviews.map((item, index) => ({
                date: new Date(item.t).toLocaleDateString(),
                pageviews: item.y,
                sessions: pageviews.sessions[index]?.y || 0
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pageviews" stroke="#8884d8" name={t('stats.pageviews')} />
                <Line type="monotone" dataKey="sessions" stroke="#82ca9d" name={t('stats.visits')} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Pages */}
      {metrics && metrics.url.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('charts.top_pages')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.url.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="y" fill="#8884d8" name={t('stats.pageviews')} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Device & Browser Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics && metrics.device.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('charts.devices')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={metrics.device}
                    dataKey="y"
                    nameKey="x"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {metrics.device.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {metrics && metrics.browser.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('charts.browsers')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={metrics.browser.slice(0, 5)}
                    dataKey="y"
                    nameKey="x"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {metrics.browser.slice(0, 5).map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Geographic & Language Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics && metrics.country.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('charts.countries')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.country.slice(0, 10).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{item.x || 'Unknown'}</span>
                    </div>
                    <span className="text-sm font-medium">{formatNumber(item.y)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {metrics && metrics.referrer.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('charts.referrers')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.referrer.slice(0, 10).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[200px]">{item.x || 'Direct'}</span>
                    </div>
                    <span className="text-sm font-medium">{formatNumber(item.y)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

