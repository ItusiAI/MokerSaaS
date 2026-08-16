'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  CreditCard, 
  Crown, 
  Coins, 
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN, enUS, ja as jaLocale, ko as koLocale } from 'date-fns/locale'
import type { Locale as DateFnsLocale } from 'date-fns/locale'

const APP_DATE_FNS_LOCALE: Record<string, DateFnsLocale> = {
  zh: zhCN,
  ja: jaLocale,
  ko: koLocale,
}
function getDateFnsLocale(locale: string | undefined | null): DateFnsLocale {
  return APP_DATE_FNS_LOCALE[locale || ''] || enUS
}

interface PaymentRecord {
  id: string
  userId: string
  stripeCustomerId: string
  paymentIntentId?: string
  checkoutSessionId?: string
  subscriptionId?: string
  invoiceId?: string
  paymentStatus: 'succeeded' | 'failed' | 'pending' | 'refunded' | 'cancelled'
  paymentType: 'subscription' | 'points_purchase' | 'one_time'
  amount: number
  currency: string
  productName?: string
  productDescription?: string
  priceId?: string
  pointsAmount?: number
  pointsType?: string
  subscriptionPlan?: string
  subscriptionPeriodStart?: string
  subscriptionPeriodEnd?: string
  refundAmount?: number
  refundReason?: string
  refundedAt?: string
  metadata?: Record<string, any> | null
  webhookEventId?: string
  createdAt: string
  updatedAt: string
}

interface PaymentStats {
  totalPayments: number
  totalAmount: number
  totalPointsPurchased: number
  totalPointsGifted: number
  successfulPayments: number
  failedPayments: number
  refundedPayments: number
  subscriptionPayments: number
  pointsPayments: number
}

export function PaymentHistory() {
  const t = useTranslations('profile.payment_history_details')
  const profileT = useTranslations('profile')
  const locale = useLocale()
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<{
    paymentType: string
    paymentStatus: string
  }>({
    paymentType: 'all',
    paymentStatus: 'all'
  })

  const ensureObjectMetadata = (metadata: PaymentRecord['metadata']) => {
    if (!metadata) return null
    if (typeof metadata === 'string') {
      try {
        return JSON.parse(metadata)
      } catch {
        return null
      }
    }
    return metadata
  }

  const inferPaymentType = (payment: PaymentRecord): PaymentRecord['paymentType'] => {
    const metadata = ensureObjectMetadata(payment.metadata)
    const metadataType = metadata?.type as string | undefined

    if (
      payment.paymentType === 'subscription' ||
      metadataType === 'subscription' ||
      payment.subscriptionId ||
      payment.subscriptionPlan
    ) {
      return 'subscription'
    }

    if (
      payment.paymentType === 'points_purchase' ||
      metadataType === 'points_purchase' ||
      (typeof payment.pointsAmount === 'number' && payment.pointsAmount > 0) ||
      payment.pointsType === 'purchased'
    ) {
      return 'points_purchase'
    }

    return payment.paymentType ?? 'one_time'
  }

  const inferSubscriptionPlan = (payment: PaymentRecord, metadata: Record<string, any> | null) => {
    if (payment.subscriptionPlan) {
      return payment.subscriptionPlan
    }

    const metadataPlan = (metadata?.plan || metadata?.subscriptionPlan) as string | undefined
    if (metadataPlan) {
      return metadataPlan
    }

    // 从 productName 中推断计划类型
    if (payment.productName) {
      const lowerProductName = payment.productName.toLowerCase()
      if (/trial/i.test(payment.productName)) {
        return 'trial'
      }
      if (/pro/i.test(payment.productName)) {
        return 'pro'
      }
      if (/enterprise/i.test(payment.productName)) {
        return 'enterprise'
      }
      if (/free/i.test(payment.productName)) {
        return 'free'
      }
    }

    return undefined
  }

  const normalizePaymentRecord = (payment: PaymentRecord): PaymentRecord => {
    const metadataObject = ensureObjectMetadata(payment.metadata)
    const resolvedType = inferPaymentType(payment)
    const resolvedSubscriptionPlan = inferSubscriptionPlan(payment, metadataObject)

    let resolvedPointsAmount = payment.pointsAmount
    if (resolvedType === 'points_purchase' && (!resolvedPointsAmount || resolvedPointsAmount <= 0)) {
      const metadataPoints = metadataObject?.points ?? metadataObject?.pointsAmount
      if (typeof metadataPoints === 'string') {
        const parsed = parseInt(metadataPoints, 10)
        if (!Number.isNaN(parsed)) {
          resolvedPointsAmount = parsed
        }
      } else if (typeof metadataPoints === 'number') {
        resolvedPointsAmount = metadataPoints
      }
    }

    return {
      ...payment,
      metadata: metadataObject,
      paymentType: resolvedType,
      subscriptionPlan: resolvedSubscriptionPlan,
      pointsAmount: resolvedPointsAmount,
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />{t('payment_statuses.succeeded')}</Badge>
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />{t('payment_statuses.failed')}</Badge>
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{t('payment_statuses.pending')}</Badge>
      case 'refunded':
        return <Badge variant="outline" className="text-orange-600"><AlertCircle className="w-3 h-3 mr-1" />{t('payment_statuses.refunded')}</Badge>
      case 'cancelled':
        return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />{t('payment_statuses.cancelled')}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'subscription':
        return <Crown className="w-4 h-4" />
      case 'points_purchase':
        return <Coins className="w-4 h-4" />
      default:
        return <CreditCard className="w-4 h-4" />
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case 'subscription':
        return t('payment_types.subscription')
      case 'points_purchase':
        return t('payment_types.points_purchase')
      default:
        return t('payment_types.other')
    }
  }

  // 根据订阅计划动态获取显示名称
  const getPlanDisplayName = (plan: string | null | undefined): string => {
    if (!plan) return ''
    const planKey = `plan_${plan.toLowerCase()}` as 'plan_pro' | 'plan_enterprise' | 'plan_free' | 'plan_trial'
    try {
      // plan_pro, plan_enterprise, plan_free 都在 profile 命名空间下
      const planName = profileT(planKey)
      // 如果翻译不存在，返回原始值（首字母大写）
      return planName || plan.charAt(0).toUpperCase() + plan.slice(1)
    } catch {
      // 如果翻译键不存在，返回格式化的原始值
      return plan.charAt(0).toUpperCase() + plan.slice(1)
    }
  }

  const getTranslatedProductName = (
    productName: string | undefined,
    paymentType: string,
    subscriptionPlan?: string
  ) => {
    if (!productName) {
      if (paymentType === 'subscription') {
        // 动态获取订阅计划名称
        if (subscriptionPlan) {
          return getPlanDisplayName(subscriptionPlan)
        }
        return t('payment_types.subscription')
      }
      if (paymentType === 'points_purchase') {
        return profileT('points_purchase')
      }
      return t('payment_types.other')
    }

    // 如果是积分购买，翻译产品名称
    if (paymentType === 'points_purchase') {
      // 匹配积分数量（中文格式）
      const chinesePointsMatch = productName.match(/(\d+(?:,\d+)*)\s*积分/)
      if (chinesePointsMatch) {
        const points = chinesePointsMatch[1]
        return `${points} ${profileT('points')}`
      }

      // 匹配积分数量（英文 / 日文 / 韩文格式）
      const altPointsMatch = productName.match(
        /(\d+(?:,\d+)*)\s*(?:Points?|クレジット|크레딧)/
      )
      if (altPointsMatch) {
        const points = altPointsMatch[1]
        return `${points} ${profileT('points')}`
      }

      // 如果都没匹配到，返回通用翻译
      return profileT('points_purchase')
    }

    // 如果是订阅，动态获取订阅计划名称
    if (paymentType === 'subscription') {
      // 优先使用 subscriptionPlan 参数
      if (subscriptionPlan) {
        return getPlanDisplayName(subscriptionPlan)
      }

      // 尝试从 productName 中推断计划类型
      const lowerProductName = productName.toLowerCase()
      if (lowerProductName.includes('trial')) {
        return getPlanDisplayName('trial')
      }
      if (lowerProductName.includes('pro')) {
        return getPlanDisplayName('pro')
      }
      if (lowerProductName.includes('enterprise')) {
        return getPlanDisplayName('enterprise')
      }
      if (lowerProductName.includes('free')) {
        return getPlanDisplayName('free')
      }

      // 如果包含订阅相关关键词但无法推断具体计划，返回通用订阅翻译
      if (lowerProductName.includes('subscription')) {
        return t('payment_types.subscription')
      }
    }

    // 其他情况直接返回原名称
    return productName
  }

  const getTranslatedProductDescription = (productDescription: string | undefined, paymentType: string) => {
    if (!productDescription) return ''

    // 积分购买不展示描述
    if (paymentType === 'points_purchase') {
      return ''
    }

    // 订阅也不展示描述
    if (paymentType === 'subscription') {
      return ''
    }

    // 其他情况直接返回原描述
    return productDescription
  }

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        includeStats: 'true',
        limit: '50'
      })
      
      if (filter.paymentType !== 'all') {
        params.append('paymentType', filter.paymentType)
      }
      
      if (filter.paymentStatus !== 'all') {
        params.append('paymentStatus', filter.paymentStatus)
      }

      const response = await fetch(`/api/user/payments?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        const normalizedPayments = (data.data.payments as PaymentRecord[]).map(normalizePaymentRecord)
        setPayments(normalizedPayments)
        setStats(data.data.stats)
      } else {
        console.error(t('errors.fetch_failed'))
      }
    } catch (error) {
      console.error(t('errors.fetch_failed'), error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [filter])

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (locale === 'zh') {
      return format(date, 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
    }
    return format(date, 'MMM dd, yyyy HH:mm', { locale: getDateFnsLocale(locale) })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-secondary/80 border-primary/30 cyber-glow-subtle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CreditCard className="w-5 h-5 text-primary" />
              {t('stats.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/80 border-primary/30 cyber-glow-subtle">
          <CardHeader>
            <CardTitle className="text-foreground">{t('title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      {stats && (
        <Card className="bg-secondary/80 border-primary/30 cyber-glow-subtle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="w-5 h-5 text-primary" />
              {t('stats.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 第一行：次数与金额相关 */}
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.totalPayments}</div>
                <div className="text-sm text-muted-foreground">{t('stats.total_payments')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary/80">
                  {formatAmount(stats.totalAmount, 'usd')}
                </div>
                <div className="text-sm text-muted-foreground">{t('stats.total_amount')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.successfulPayments}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('stats.successful_payments')}
                </div>
              </div>

              {/* 第二行：积分相关 */}
              <div className="text-center">
                <div className="text-2xl font-bold text-primary/70">
                  {stats.totalPointsPurchased?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('stats.total_points_purchased')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary/70">
                  {stats.totalPointsGifted?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('stats.total_points_gifted')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 支付记录 */}
      <Card className="bg-secondary/80 border-primary/30 cyber-glow-subtle">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CreditCard className="w-5 h-5 text-primary" />
              {t('title')}
            </CardTitle>
            
            <div className="flex gap-2">
              <Select value={filter.paymentType} onValueChange={(value) => setFilter(prev => ({ ...prev, paymentType: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={t('filters.type_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.all_types')}</SelectItem>
                  <SelectItem value="subscription">{t('payment_types.subscription')}</SelectItem>
                  <SelectItem value="points_purchase">{t('payment_types.points_purchase')}</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filter.paymentStatus} onValueChange={(value) => setFilter(prev => ({ ...prev, paymentStatus: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={t('filters.status_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.all_statuses')}</SelectItem>
                  <SelectItem value="succeeded">{t('payment_statuses.succeeded')}</SelectItem>
                  <SelectItem value="failed">{t('payment_statuses.failed')}</SelectItem>
                  <SelectItem value="pending">{t('payment_statuses.pending')}</SelectItem>
                  <SelectItem value="refunded">{t('payment_statuses.refunded')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50 text-primary" />
              <p>{t('empty_state.title')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table.type')}</TableHead>
                    <TableHead>{t('table.product')}</TableHead>
                    <TableHead>{t('table.amount')}</TableHead>
                    <TableHead>{t('table.points')}</TableHead>
                    <TableHead>{t('table.status')}</TableHead>
                    <TableHead>{t('table.time')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(payment.paymentType)}
                          <span className="text-sm">{getTypeName(payment.paymentType)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">
                            {getTranslatedProductName(payment.productName, payment.paymentType, payment.subscriptionPlan)}
                          </div>
                          {payment.productDescription && payment.paymentType !== 'subscription' && (
                            <div className="text-sm text-primary/80 font-medium">
                              {getTranslatedProductDescription(payment.productDescription, payment.paymentType)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatAmount(payment.amount, payment.currency)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.pointsAmount ? (
                          <div className="flex items-center gap-1">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span>{payment.pointsAmount.toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.paymentStatus)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(payment.createdAt)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}