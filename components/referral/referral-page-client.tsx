'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useApiError } from '@/hooks/use-api-error'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Users, 
  Gift, 
  TrendingUp, 
  Copy, 
  Check,
  Link as LinkIcon,
  Award,
  Calendar,
  Sparkles,
  Info,
  User,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Coins,
  Crown
} from 'lucide-react'
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
import { format } from 'date-fns'
import { zhCN, enUS, ja as jaLocale, ko as koLocale } from 'date-fns/locale'
import type { Locale as DateFnsLocale } from 'date-fns/locale'
import { useLocale } from 'next-intl'

const APP_DATE_FNS_LOCALE: Record<string, DateFnsLocale> = {
  'zh-CN': zhCN,
  'zh-TW': zhCN,
  ja: jaLocale,
  ko: koLocale,
}
function getDateFnsLocale(locale: string | undefined | null): DateFnsLocale {
  return APP_DATE_FNS_LOCALE[locale || ''] || enUS
}

interface ReferralStats {
  totalReferrals: number
  subscribedReferrals: number
  totalPointsEarned: number
  referralCode?: string
  canEdit?: boolean
  referralRecords: Array<{
    id: string
    referredUserName: string | null
    referredUserEmail: string | null
    referredUserImage: string | null
    hasSubscribed: boolean
    createdAt: Date | string
  }>
}

interface ReferralRecord {
  id: string
  referredId: string
  referralCode: string
  hasSubscribed: boolean
  subscriptionRewarded: boolean
  createdAt: Date | string
  referredUserEmail: string | null
  referredUserName: string | null
  referredUserImage: string | null
  referredUserSubscriptionStatus: string | null
}

export default function ReferralPageClient() {
  const { data: session, status } = useSession()
  const t = useTranslations('referral_page')
  const tCommon = useTranslations('profile')
  const tApi = useApiError()
  const locale = useLocale()
  const router = useRouter()
  
  const [customCode, setCustomCode] = useState('')
  const [currentCode, setCurrentCode] = useState('')
  const [canEdit, setCanEdit] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<ReferralRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [recordFilter, setRecordFilter] = useState<'all' | 'subscribed' | 'pending'>('all')
  const [recordsPage, setRecordsPage] = useState(1)
  const [rewards, setRewards] = useState<any[]>([])
  const [loadingRewards, setLoadingRewards] = useState(false)
  const [rewardFilter, setRewardFilter] = useState<'all' | 'register_bonus' | 'referrer_bonus' | 'subscription_reward'>('all')
  const [rewardsPage, setRewardsPage] = useState(1)

  // 如果未登录，重定向到登录页
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/auth/signin`)
    }
  }, [status, router])

  // 获取推荐统计数据
  useEffect(() => {
    if (session?.user?.id) {
      fetchReferralStats()
      fetchRecords()
      fetchRewards()
    }
  }, [session, recordsPage, rewardsPage])

  const fetchReferralStats = async () => {
    try {
      const response = await fetch('/api/referral/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setCurrentCode(data.stats.referralCode || '')
        setCanEdit(Boolean(data.stats.canEdit))
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCode = async () => {
    if (!customCode.trim()) {
      toast.error(t('custom_code.invalid_format'))
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch('/api/referral/update-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customCode: customCode.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(t('custom_code.success'))
        setCurrentCode(data.referralCode)
        setCustomCode('')
        fetchReferralStats()
      } else {
        // 根据错误 key 显示对应的翻译
        toast.error(tApi(data.error) || t('custom_code.error'))
      }
    } catch (error) {
      console.error('Error updating referral code:', error)
      toast.error(t('custom_code.error'))
    } finally {
      setIsUpdating(false)
    }
  }

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'code') {
        setCodeCopied(true)
        setTimeout(() => setCodeCopied(false), 2000)
        toast.success(tCommon('referral.code_copied'))
      } else {
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
        toast.success(tCommon('referral.link_copied'))
      }
    } catch (error) {
      toast.error(tCommon('referral.copy_failed'))
    }
  }

  const referralLink = currentCode 
    ? `${window.location.origin}/auth/signup?ref=${currentCode}`
    : ''

  const fetchRecords = async (page = 1) => {
    setLoadingRecords(true)
    try {
      const response = await fetch(`/api/referral/records?page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setRecords(data.data)
      }
    } catch (error) {
      console.error('Error fetching referral records:', error)
    } finally {
      setLoadingRecords(false)
    }
  }

  // 日期格式化函数
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    if (locale === 'zh-CN' || locale === 'zh-TW') {
      return format(date, 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
    }
    return format(date, 'MMM dd, yyyy HH:mm', { locale: getDateFnsLocale(locale) })
  }

  const fetchRewards = async (page = 1) => {
    setLoadingRewards(true)
    try {
      const response = await fetch(`/api/referral/rewards?page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setRewards(data.data)
      }
    } catch (error) {
      console.error('Error fetching referral rewards:', error)
    } finally {
      setLoadingRewards(false)
    }
  }

  // 筛选后的数据
  const filteredRecords = records.filter((record) => {
    if (recordFilter === 'all') return true
    if (recordFilter === 'subscribed') return record.hasSubscribed
    if (recordFilter === 'pending') return !record.hasSubscribed
    return true
  })

  const filteredRewards = rewards.filter((reward) => {
    if (rewardFilter === 'all') return true
    return reward.action === rewardFilter
  })

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'register_bonus':
        return t('rewards.action_register_bonus')
      case 'referrer_bonus':
        return t('rewards.action_referrer_bonus')
      case 'subscription_reward':
        return t('rewards.action_subscription_reward')
      default:
        return action
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container max-w-6xl mx-auto pt-20 pb-8 px-4">
        <div className="text-center">
          <p className="text-muted-foreground">{tCommon('loading')}</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="container max-w-6xl mx-auto pt-20 pb-8 px-4 space-y-6">
      {/* 页面标题 */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          {t('title')}
        </h1>
        <p className="text-muted-foreground text-lg">{t('subtitle')}</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('stats.total_invites')}</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats?.totalReferrals || 0}
                </p>
                <p className="text-xs text-muted-foreground">{t('stats.people')}</p>
              </div>
              <Users className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('stats.total_rewards')}</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {stats?.totalPointsEarned || 0}
                </p>
                <p className="text-xs text-muted-foreground">{t('stats.points')}</p>
              </div>
              <Gift className="h-10 w-10 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('stats.subscribed_users')}</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats?.subscribedReferrals || 0}
                </p>
                <p className="text-xs text-muted-foreground">{t('stats.people')}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('stats.pending_users')}</p>
                <p className="text-3xl font-bold text-purple-600">
                  {(stats?.totalReferrals || 0) - (stats?.subscribedReferrals || 0)}
                </p>
                <p className="text-xs text-muted-foreground">{t('stats.people')}</p>
              </div>
              <Award className="h-10 w-10 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 自定义推荐码 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>{t('custom_code.title')}</span>
            </CardTitle>
            <CardDescription>{t('custom_code.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentCode ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('custom_code.current_code')}
                  </label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input value={currentCode} readOnly className="font-mono text-lg" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(currentCode, 'code')}
                    >
                      {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {canEdit ? (
                  <div className="space-y-3">
                    <Input
                      placeholder={t('custom_code.placeholder')}
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value)}
                      maxLength={20}
                      className="font-mono"
                    />
                    <Button
                      onClick={handleUpdateCode}
                      disabled={isUpdating || !customCode.trim()}
                      className="w-full"
                    >
                      {isUpdating ? t('custom_code.button_updating') : t('custom_code.button')}
                    </Button>
                    <div className="flex items-start space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <p className="text-sm text-yellow-600">
                        {t('custom_code.note')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-2 p-3 bg-muted/50 rounded-lg">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {t('custom_code.already_set')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  placeholder={t('custom_code.placeholder')}
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  maxLength={20}
                  className="font-mono"
                />
                <Button
                  onClick={handleUpdateCode}
                  disabled={isUpdating || !customCode.trim()}
                  className="w-full"
                >
                  {isUpdating ? t('custom_code.button_updating') : t('custom_code.button')}
                </Button>
                <div className="flex items-start space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-600">
                    {t('custom_code.note')}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 分享推荐 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              <span>{t('share.title')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentCode ? (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {tCommon('referral.referral_link')}
                  </label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input value={referralLink} readOnly className="text-sm" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(referralLink, 'link')}
                    >
                      {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(currentCode, 'code')}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {t('share.copy_code')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(referralLink, 'link')}
                    className="w-full"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    {t('share.copy_link')}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">{t('custom_code.note')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 推荐记录 */}
      <Card className="bg-secondary/80 border-primary/30 cyber-glow-subtle">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="w-5 h-5 text-primary" />
              {t('records.title')}
            </CardTitle>
            <Select value={recordFilter} onValueChange={(value: any) => setRecordFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('records.filter_all')}</SelectItem>
                <SelectItem value="subscribed">{t('records.subscribed')}</SelectItem>
                <SelectItem value="pending">{t('records.pending')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardDescription>{t('records.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRecords ? (
            <div className="text-center py-8 text-muted-foreground">{t('records.loading')}</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50 text-primary" />
              <p>{t('records.empty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('records.table.user')}</TableHead>
                    <TableHead>{t('records.table.email')}</TableHead>
                    <TableHead>{t('records.table.register_time')}</TableHead>
                    <TableHead>{t('records.table.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          <span className="font-medium text-foreground">
                            {record.referredUserName || t('records.unknown_user')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {record.referredUserEmail || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(record.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.hasSubscribed ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {t('records.subscribed')}
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {t('records.pending')}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 赠送记录 */}
      <Card className="bg-secondary/80 border-primary/30 cyber-glow-subtle">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Gift className="w-5 h-5 text-primary" />
              {t('rewards.title')}
            </CardTitle>
            <Select value={rewardFilter} onValueChange={(value: any) => setRewardFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('rewards.filter_all')}</SelectItem>
                <SelectItem value="register_bonus">{t('rewards.action_register_bonus')}</SelectItem>
                <SelectItem value="referrer_bonus">{t('rewards.action_referrer_bonus')}</SelectItem>
                <SelectItem value="subscription_reward">{t('rewards.action_subscription_reward')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardDescription>{t('rewards.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRewards ? (
            <div className="text-center py-8 text-muted-foreground">{t('rewards.loading')}</div>
          ) : filteredRewards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="w-12 h-12 mx-auto mb-4 opacity-50 text-primary" />
              <p>{t('rewards.empty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('rewards.table.action')}</TableHead>
                    <TableHead>{t('rewards.table.from')}</TableHead>
                    <TableHead>{t('rewards.table.reward')}</TableHead>
                    <TableHead>{t('rewards.table.create_time')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRewards.map((reward) => (
                    <TableRow key={reward.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4 text-primary" />
                          <span className="font-medium text-foreground">
                            {getActionLabel(reward.action)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {reward.referredUserName || reward.referredUserEmail || t('rewards.unknown_user')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {reward.pointsAwarded && (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">
                              <Coins className="w-3 h-3 mr-1" />
                              +{reward.pointsAwarded} {t('rewards.points')}
                            </Badge>
                          )}
                          {reward.subscriptionDaysExtended && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-700">
                              <Crown className="w-3 h-3 mr-1" />
                              +{reward.subscriptionDaysExtended} {t('rewards.days')}
                            </Badge>
                          )}
                          {!reward.pointsAwarded && !reward.subscriptionDaysExtended && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(reward.createdAt)}
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

      {/* 奖励规则 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gift className="h-5 w-5 text-primary" />
            <span>{t('rules.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 注册奖励 */}
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-full">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="font-semibold text-blue-600">{t('rules.rule1_title')}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('rules.rule1_desc')}</p>
            </div>

            {/* 订阅返利 */}
            <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-2 bg-green-500/20 rounded-full">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="font-semibold text-green-600">{t('rules.rule2_title')}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('rules.rule2_desc')}</p>
            </div>

            {/* 多次奖励 */}
            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-2 bg-purple-500/20 rounded-full">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="font-semibold text-purple-600">{t('rules.rule3_title')}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('rules.rule3_desc')}</p>
            </div>

            {/* 时效限制 */}
            <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-2 bg-orange-500/20 rounded-full">
                  <Calendar className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="font-semibold text-orange-600">{t('rules.rule4_title')}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('rules.rule4_desc')}</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">{t('rules.note')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

