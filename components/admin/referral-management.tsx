"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Gift, 
  RefreshCw,
  Search,
  User,
  Mail,
  CheckCircle,
  Clock,
  Coins,
  Crown,
  Calendar
} from 'lucide-react'
import { format } from 'date-fns'
import { useTranslations, useLocale } from 'next-intl'
import { zhCN, enUS } from 'date-fns/locale'
import { toast } from 'sonner'

interface ReferralStats {
  totalReferrals: number
  subscribedReferrals: number
  totalPointsAwarded: number
}

interface ReferralRecord {
  id: string
  referrerId: string
  referredId: string
  referralCode: string
  hasSubscribed: boolean
  subscriptionRewarded: boolean
  createdAt: string
  referrerName: string | null
  referrerEmail: string | null
  referredName: string | null
  referredEmail: string | null
}

interface ReferralReward {
  id: string
  userId: string
  referralId: string | null
  action: string
  description: string | null
  pointsAwarded: number | null
  subscriptionDaysExtended: number | null
  createdAt: string
  userName: string | null
  userEmail: string | null
  referredUserName: string | null
  referredUserEmail: string | null
}

export function ReferralManagement() {
  const t = useTranslations('admin.referral')
  const locale = useLocale()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [records, setRecords] = useState<ReferralRecord[]>([])
  const [rewards, setRewards] = useState<ReferralReward[]>([])
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [recordsPage, setRecordsPage] = useState(1)
  const [rewardsPage, setRewardsPage] = useState(1)
  const [activeTab, setActiveTab] = useState('records')

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (locale === 'zh') {
      return format(date, 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
    } else {
      return format(date, 'MMM dd, yyyy HH:mm', { locale: enUS })
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/referrals?action=stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error)
    }
  }

  const fetchRecords = async (page = 1) => {
    try {
      const response = await fetch(`/api/admin/referrals?action=records&page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setRecords(data.records)
      }
    } catch (error) {
      console.error('Error fetching referral records:', error)
    }
  }

  const fetchRewards = async (page = 1) => {
    try {
      const response = await fetch(`/api/admin/referrals?action=rewards&page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setRewards(data.rewards)
      }
    } catch (error) {
      console.error('Error fetching referral rewards:', error)
    }
  }

  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      setLoading(true)
      await Promise.all([fetchStats(), fetchRecords(), fetchRewards()])
      if (isMounted) {
        setInitialized(true)
        setLoading(false)
      }
    }

    initialize()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!initialized) return

    if (activeTab === 'records') {
      fetchRecords(recordsPage)
    } else if (activeTab === 'rewards') {
      fetchRewards(rewardsPage)
    }
  }, [recordsPage, rewardsPage, activeTab, initialized])

  const getRewardActionLabel = (action: string) => {
    switch (action) {
      case 'register_bonus':
        return t('rewards.actions.register_bonus')
      case 'referrer_bonus':
        return t('rewards.actions.referrer_bonus')
      case 'subscription_reward':
        return t('rewards.actions.subscription_reward')
      default:
        return t('rewards.actions.unknown', { action })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.total_referrals')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.subscribed_referrals')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.subscribedReferrals || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.total_points')}</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPointsAwarded || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="records">{t('tabs.records')}</TabsTrigger>
          <TabsTrigger value="rewards">{t('tabs.rewards')}</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('records.title')}</CardTitle>
              <CardDescription>{t('records.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t('records.empty')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('records.table.referrer')}</TableHead>
                        <TableHead>{t('records.table.referred')}</TableHead>
                        <TableHead>{t('records.table.code')}</TableHead>
                        <TableHead>{t('records.table.status')}</TableHead>
                        <TableHead>{t('records.table.created_at')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-primary" />
                              <div>
                                <div className="font-medium">{record.referrerName || record.referrerEmail || '-'}</div>
                                <div className="text-xs text-muted-foreground">{record.referrerEmail}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{record.referredName || record.referredEmail || '-'}</div>
                                <div className="text-xs text-muted-foreground">{record.referredEmail}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm">{record.referralCode}</code>
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
                          <TableCell>
                            <div className="text-sm">{formatDate(record.createdAt)}</div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('rewards.title')}</CardTitle>
              <CardDescription>{t('rewards.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {rewards.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t('rewards.empty')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('rewards.table.user')}</TableHead>
                        <TableHead>{t('rewards.table.from')}</TableHead>
                        <TableHead>{t('rewards.table.action')}</TableHead>
                        <TableHead>{t('rewards.table.reward')}</TableHead>
                        <TableHead>{t('rewards.table.created_at')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rewards.map((reward) => (
                        <TableRow key={reward.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-primary" />
                              <div>
                                <div className="font-medium">{reward.userName || reward.userEmail || '-'}</div>
                                <div className="text-xs text-muted-foreground">{reward.userEmail}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {reward.referredUserName || reward.referredUserEmail || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{getRewardActionLabel(reward.action)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {reward.pointsAwarded && (
                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">
                                  <Coins className="w-3 h-3 mr-1" />
                                  +{reward.pointsAwarded}
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
                            <div className="text-sm">{formatDate(reward.createdAt)}</div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

