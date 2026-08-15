"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  UserPlus, 
  Users, 
  Crown,
  Copy,
  ExternalLink,
  RefreshCw,
  Loader2,
  CheckCircle,
  Gift,
  Calendar
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { toast } from 'sonner'

interface ReferralHistoryItem {
  id: string
  userId: string
  referralId: string | null
  action: string
  description: string | null
  pointsAwarded: number | null
  subscriptionDaysExtended: number | null
  createdAt: Date | string
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

interface ReferralData {
  referralCode: string
  referralLink: string
  stats: {
    totalReferrals: number
    subscribedReferrals: number
    history: ReferralHistoryItem[]
    referralRecords: ReferralRecord[]
  }
}

export function ReferralInfo() {
  const locale = useLocale()
  const t = useTranslations("profile")
  const { data: session, status } = useSession()
  
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchReferralData()
    }
  }, [status, session])

  const fetchReferralData = async () => {
    try {
      const response = await fetch('/api/user/referral')
      if (response.ok) {
        const data = await response.json()
        setReferralData(data)
      }
    } catch (error) {
      console.error('获取推荐信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchReferralData()
    setRefreshing(false)
  }

  const handleCopyCode = async () => {
    if (referralData?.referralCode) {
      try {
        await navigator.clipboard.writeText(referralData.referralCode)
        setCopied(true)
        toast.success(t('referral.code_copied'))
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('复制失败:', error)
        toast.error(t('referral.copy_failed'))
      }
    }
  }

  const handleCopyLink = async () => {
    if (referralData?.referralLink) {
      try {
        await navigator.clipboard.writeText(referralData.referralLink)
        setCopied(true)
        toast.success(t('referral.link_copied'))
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('复制失败:', error)
        toast.error(t('referral.copy_failed'))
      }
    }
  }

  const formatDetailedDate = (dateString: Date | string) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    if (locale === 'zh') {
      return format(date, 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
    }
    return format(date, 'MMM dd, yyyy HH:mm', { locale: enUS })
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'register_bonus':
        return t('referral.action_register_bonus')
      case 'referrer_bonus':
        return t('referral.action_referrer_bonus')
      case 'subscription_reward':
        return t('referral.action_subscription_reward')
      default:
        return action
    }
  }

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-secondary/80 backdrop-blur-sm cyber-glow-subtle">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-foreground">
            <UserPlus className="h-5 w-5 text-primary" />
            <span>{t('referral.title')}</span>
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
            <UserPlus className="h-5 w-5 text-primary" />
            <span>{t('referral.title')}</span>
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
          {t('referral.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 推荐统计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-secondary/50 border border-primary/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">{t('referral.total_referrals')}</span>
              </div>
              <span className="font-bold text-primary text-xl">
                {referralData?.stats.totalReferrals || 0}
              </span>
            </div>
          </div>
          <div className="p-4 bg-secondary/50 border border-primary/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Crown className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">{t('referral.subscribed_referrals')}</span>
              </div>
              <span className="font-bold text-primary text-xl">
                {referralData?.stats.subscribedReferrals || 0}
              </span>
            </div>
          </div>
        </div>

        {/* 推荐码 */}
        <div className="p-4 bg-secondary/50 border border-primary/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">{t('referral.referral_code')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <code className="flex-1 px-3 py-2 bg-background border border-primary/30 rounded text-primary font-mono text-sm">
              {referralData?.referralCode || '-'}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="h-9 px-3 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* 推荐链接 */}
        <div className="p-4 bg-secondary/50 border border-primary/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">{t('referral.referral_link')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <code className="flex-1 px-3 py-2 bg-background border border-primary/30 rounded text-primary font-mono text-xs break-all">
              {referralData?.referralLink || '-'}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-9 px-3 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => referralData?.referralLink && window.open(referralData.referralLink, '_blank')}
              className="h-9 px-3 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 推荐记录（按被邀请用户分组显示） */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{t('referral.records')}</span>
          </div>
          {(() => {
            const records = referralData?.stats.referralRecords || []
            const history = referralData?.stats.history || []

            if (records.length === 0) {
              return (
                <div className="text-center py-6 text-muted-foreground border border-primary/20 rounded-lg bg-secondary/30">
                  <Users className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('referral.no_records')}</p>
                </div>
              )
            }

            return (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {records.map((record) => {
                  // 找到与该推荐记录相关的奖励历史
                  const relatedHistory = history.filter(
                    (item) => item.referralId === record.id
                  )

                  return (
                    <div
                      key={`record-${record.id}`}
                      className="p-4 bg-secondary/30 border border-primary/20 rounded-lg space-y-3"
                    >
                      {/* 被邀请用户信息 */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                            {record.referredUserImage ? (
                              <img
                                src={record.referredUserImage}
                                alt={record.referredUserName || record.referredUserEmail || ''}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-primary font-medium">
                                {(record.referredUserName || record.referredUserEmail || 'U').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {record.referredUserName || record.referredUserEmail || t('referral.anonymous_user')}
                              </p>
                              {record.hasSubscribed && (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs">
                                  {t('referral.subscribed')}
                                </Badge>
                              )}
                              {!record.hasSubscribed && (
                                <Badge variant="outline" className="text-xs">
                                  {t('referral.not_subscribed')}
                                </Badge>
                              )}
                            </div>
                            {record.referredUserEmail && record.referredUserName && (
                              <p className="text-xs text-muted-foreground truncate">
                                {record.referredUserEmail}
                              </p>
                            )}
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDetailedDate(record.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 相关奖励记录 */}
                      {relatedHistory.length > 0 && (
                        <div className="pl-4 border-l-2 border-primary/30 space-y-2">
                          {relatedHistory.map((historyItem) => (
                            <div
                              key={`history-${historyItem.id}`}
                              className="flex items-center justify-between py-2"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Gift className="h-4 w-4 text-primary" />
                                  <span className="text-sm text-foreground">
                                    {getActionLabel(historyItem.action)}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground pl-6">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDetailedDate(historyItem.createdAt)}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {historyItem.pointsAwarded && (
                                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs">
                                    +{historyItem.pointsAwarded} {t('points')}
                                  </Badge>
                                )}
                                {historyItem.subscriptionDaysExtended && (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs">
                                    +{historyItem.subscriptionDaysExtended} {t('referral.days')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      </CardContent>
    </Card>
  )
}

