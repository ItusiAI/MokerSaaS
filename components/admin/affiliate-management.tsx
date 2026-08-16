"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  TrendingUp, 
  Users,
  DollarSign,
  Wallet,
  User,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  Edit
} from 'lucide-react'
import { format } from 'date-fns'
import { useTranslations, useLocale } from 'next-intl'
import { zhCN, enUS } from 'date-fns/locale'
import { toast } from 'sonner'
import { useApiError } from '@/hooks/use-api-error'

interface AffiliateStats {
  totalProfiles: number
  totalRelations: number
  convertedRelations: number
  totalEarnings: number
  totalWithdrawals: number
}

export function AffiliateManagement() {
  const t = useTranslations('admin.affiliate')
  const tApi = useApiError()
  const locale = useLocale()
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [profiles, setProfiles] = useState<any[]>([])
  const [relations, setRelations] = useState<any[]>([])
  const [earnings, setEarnings] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [loadingRelations, setLoadingRelations] = useState(false)
  const [loadingEarnings, setLoadingEarnings] = useState(false)
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false)
  const [activeTab, setActiveTab] = useState('profiles')
  const [profilesPage, setProfilesPage] = useState(1)
  const [relationsPage, setRelationsPage] = useState(1)
  const [earningsPage, setEarningsPage] = useState(1)
  const [withdrawalsPage, setWithdrawalsPage] = useState(1)
  const [initialized, setInitialized] = useState(false)
  
  // 处理提现相关状态
  const [showProcessDialog, setShowProcessDialog] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null)
  const [processStatus, setProcessStatus] = useState<string>('')
  const [transactionId, setTransactionId] = useState<string>('')
  const [failureReason, setFailureReason] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (locale === 'zh') {
      return format(date, 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
    } else {
      return format(date, 'MMM dd, yyyy HH:mm', { locale: enUS })
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount / 100)
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/affiliates?action=stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching affiliate stats:', error)
    }
  }

  const fetchProfiles = async (page = 1) => {
    setLoadingProfiles(true)
    try {
      const response = await fetch(`/api/admin/affiliates?action=profiles&page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setProfiles(data.profiles)
      }
    } catch (error) {
      console.error('Error fetching affiliate profiles:', error)
    } finally {
      setLoadingProfiles(false)
    }
  }

  const fetchRelations = async (page = 1) => {
    setLoadingRelations(true)
    try {
      const response = await fetch(`/api/admin/affiliates?action=relations&page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setRelations(data.relations)
      }
    } catch (error) {
      console.error('Error fetching affiliate relations:', error)
    } finally {
      setLoadingRelations(false)
    }
  }

  const fetchEarnings = async (page = 1) => {
    setLoadingEarnings(true)
    try {
      const response = await fetch(`/api/admin/affiliates?action=earnings&page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setEarnings(data.earnings)
      }
    } catch (error) {
      console.error('Error fetching affiliate earnings:', error)
    } finally {
      setLoadingEarnings(false)
    }
  }

  const fetchWithdrawals = async (page = 1) => {
    setLoadingWithdrawals(true)
    try {
      const response = await fetch(`/api/admin/affiliates?action=withdrawals&page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setWithdrawals(data.withdrawals)
      }
    } catch (error) {
      console.error('Error fetching affiliate withdrawals:', error)
    } finally {
      setLoadingWithdrawals(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      setLoading(true)
      await Promise.all([fetchStats(), fetchProfiles(1)])
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

    if (activeTab === 'profiles') {
      fetchProfiles(profilesPage)
    } else if (activeTab === 'relations') {
      fetchRelations(relationsPage)
    } else if (activeTab === 'earnings') {
      fetchEarnings(earningsPage)
    } else if (activeTab === 'withdrawals') {
      fetchWithdrawals(withdrawalsPage)
    }
  }, [profilesPage, relationsPage, earningsPage, withdrawalsPage, activeTab, initialized])

  const handleOpenProcessDialog = (withdrawal: any) => {
    setSelectedWithdrawal(withdrawal)
    setProcessStatus('')
    setTransactionId('')
    setFailureReason('')
    setShowProcessDialog(true)
  }

  const handleProcessWithdrawal = async () => {
    if (!selectedWithdrawal || !processStatus) {
      toast.error(t('withdrawals.process.status_required'))
      return
    }

    if (processStatus === 'COMPLETED' && !transactionId.trim()) {
      toast.error(t('withdrawals.process.transaction_id_required'))
      return
    }

    if (processStatus === 'FAILED' && !failureReason.trim()) {
      toast.error(t('withdrawals.process.failure_reason_required'))
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/admin/affiliates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId: selectedWithdrawal.id,
          status: processStatus,
          transactionId: transactionId.trim() || undefined,
          failureReason: failureReason.trim() || undefined,
          locale,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(t('withdrawals.process.success'))
        setShowProcessDialog(false)
        setSelectedWithdrawal(null)
        setProcessStatus('')
        setTransactionId('')
        setFailureReason('')
        // 刷新数据
        fetchWithdrawals(withdrawalsPage)
        fetchStats()
      } else {
        toast.error(tApi(data.error) || t('withdrawals.process.failed'))
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error)
      toast.error(t('withdrawals.process.failed'))
    } finally {
      setIsProcessing(false)
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.total_profiles')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProfiles || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.total_relations')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRelations || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.converted_relations')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.convertedRelations || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.total_earnings')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(stats?.totalEarnings || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.total_withdrawals')}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(stats?.totalWithdrawals || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profiles">{t('tabs.profiles')}</TabsTrigger>
          <TabsTrigger value="relations">{t('tabs.relations')}</TabsTrigger>
          <TabsTrigger value="earnings">{t('tabs.earnings')}</TabsTrigger>
          <TabsTrigger value="withdrawals">{t('tabs.withdrawals')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('profiles.title')}</CardTitle>
              <CardDescription>{t('profiles.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProfiles ? (
                <div className="text-center py-8 text-muted-foreground">{t('profiles.loading')}</div>
              ) : profiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t('profiles.empty')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('profiles.table.user')}</TableHead>
                        <TableHead>{t('profiles.table.code')}</TableHead>
                        <TableHead>{t('profiles.table.balance')}</TableHead>
                        <TableHead>{t('profiles.table.frozen_balance')}</TableHead>
                        <TableHead>{t('profiles.table.created_at')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-primary" />
                              <div>
                                <div className="font-medium">{profile.userName || profile.userEmail || '-'}</div>
                                <div className="text-xs text-muted-foreground">{profile.userEmail}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm">{profile.code}</code>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatAmount(profile.balance)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatAmount(profile.frozenBalance)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{formatDate(profile.createdAt)}</div>
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

        <TabsContent value="relations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('relations.title')}</CardTitle>
              <CardDescription>{t('relations.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRelations ? (
                <div className="text-center py-8 text-muted-foreground">{t('relations.loading')}</div>
              ) : relations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t('relations.empty')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('relations.table.referrer')}</TableHead>
                        <TableHead>{t('relations.table.invitee')}</TableHead>
                        <TableHead>{t('relations.table.status')}</TableHead>
                        <TableHead>{t('relations.table.expires_at')}</TableHead>
                        <TableHead>{t('relations.table.created_at')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relations.map((relation) => (
                        <TableRow key={relation.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-primary" />
                              <div>
                                <div className="font-medium">{relation.referrerName || relation.referrerEmail || '-'}</div>
                                <div className="text-xs text-muted-foreground">{relation.referrerEmail}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{relation.inviteeName || relation.inviteeEmail || '-'}</div>
                                <div className="text-xs text-muted-foreground">{relation.inviteeEmail}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {relation.hasConverted ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {t('relations.converted')}
                              </Badge>
                            ) : new Date(relation.expiresAt) < new Date() ? (
                              <Badge variant="secondary">
                                <XCircle className="w-3 h-3 mr-1" />
                                {t('relations.expired')}
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <Clock className="w-3 h-3 mr-1" />
                                {t('relations.pending')}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{formatDate(relation.expiresAt)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{formatDate(relation.createdAt)}</div>
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

        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('earnings.title')}</CardTitle>
              <CardDescription>{t('earnings.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEarnings ? (
                <div className="text-center py-8 text-muted-foreground">{t('earnings.loading')}</div>
              ) : earnings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t('earnings.empty')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('earnings.table.affiliate')}</TableHead>
                        <TableHead>{t('earnings.table.invitee')}</TableHead>
                        <TableHead>{t('earnings.table.amount')}</TableHead>
                        <TableHead>{t('earnings.table.status')}</TableHead>
                        <TableHead>{t('earnings.table.created_at')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {earnings.map((earning) => (
                        <TableRow key={earning.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-primary" />
                              <div>
                                <div className="font-medium">{earning.affiliateUserName || earning.affiliateUserEmail || '-'}</div>
                                <div className="text-xs text-muted-foreground">{earning.affiliateUserEmail}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {earning.inviteeUserName || earning.inviteeUserEmail || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatAmount(earning.amount)}</div>
                          </TableCell>
                          <TableCell>
                            {earning.status === 'FROZEN' && (
                              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">
                                <Clock className="w-3 h-3 mr-1" />
                                {t('earnings.frozen')}
                              </Badge>
                            )}
                            {earning.status === 'RELEASED' && (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {t('earnings.released')}
                              </Badge>
                            )}
                            {earning.status === 'CANCELLED' && (
                              <Badge variant="secondary">
                                <XCircle className="w-3 h-3 mr-1" />
                                {t('earnings.cancelled')}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{formatDate(earning.createdAt)}</div>
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

        <TabsContent value="withdrawals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('withdrawals.title')}</CardTitle>
              <CardDescription>{t('withdrawals.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingWithdrawals ? (
                <div className="text-center py-8 text-muted-foreground">{t('withdrawals.loading')}</div>
              ) : withdrawals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t('withdrawals.empty')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('withdrawals.table.user')}</TableHead>
                        <TableHead>{t('withdrawals.table.amount')}</TableHead>
                        <TableHead>{t('withdrawals.table.payment_method')}</TableHead>
                        <TableHead>{t('withdrawals.table.account')}</TableHead>
                        <TableHead>{t('withdrawals.table.status')}</TableHead>
                        <TableHead>{t('withdrawals.table.created_at')}</TableHead>
                        <TableHead>{t('withdrawals.table.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-primary" />
                              <div>
                                <div className="font-medium">{withdrawal.userName || withdrawal.userEmail || '-'}</div>
                                <div className="text-xs text-muted-foreground">{withdrawal.userEmail}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatAmount(withdrawal.amount)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{withdrawal.paymentMethod}</div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm font-medium">{withdrawal.accountName}</div>
                              <div className="text-xs text-muted-foreground">{withdrawal.accountInfo}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {withdrawal.status === 'PENDING' && (
                              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">
                                <Clock className="w-3 h-3 mr-1" />
                                {t('withdrawals.pending')}
                              </Badge>
                            )}
                            {withdrawal.status === 'PROCESSING' && (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-700">
                                <Clock className="w-3 h-3 mr-1" />
                                {t('withdrawals.processing')}
                              </Badge>
                            )}
                            {withdrawal.status === 'COMPLETED' && (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {t('withdrawals.completed')}
                              </Badge>
                            )}
                            {withdrawal.status === 'FAILED' && (
                              <Badge variant="destructive">
                                <XCircle className="w-3 h-3 mr-1" />
                                {t('withdrawals.failed')}
                              </Badge>
                            )}
                            {withdrawal.status === 'CANCELLED' && (
                              <Badge variant="secondary">
                                <XCircle className="w-3 h-3 mr-1" />
                                {t('withdrawals.cancelled')}
                              </Badge>
                            )}
                            {withdrawal.failureReason && (
                              <div className="text-xs text-red-500 mt-1">{withdrawal.failureReason}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{formatDate(withdrawal.createdAt)}</div>
                          </TableCell>
                          <TableCell>
                            {withdrawal.status === 'PENDING' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenProcessDialog(withdrawal)}
                                className="flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                {t('withdrawals.process.button')}
                              </Button>
                            )}
                            {withdrawal.status === 'PROCESSING' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenProcessDialog(withdrawal)}
                                className="flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                {t('withdrawals.process.update')}
                              </Button>
                            )}
                            {['COMPLETED', 'FAILED', 'CANCELLED'].includes(withdrawal.status) && (
                              <span className="text-sm text-muted-foreground">-</span>
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
        </TabsContent>
      </Tabs>

      {/* 处理提现对话框 */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('withdrawals.process.title')}</DialogTitle>
            <DialogDescription>{t('withdrawals.process.description')}</DialogDescription>
          </DialogHeader>
          
          {selectedWithdrawal && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('withdrawals.process.user')}</Label>
                <div className="text-sm font-medium">
                  {selectedWithdrawal.userName || selectedWithdrawal.userEmail || '-'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('withdrawals.process.amount')}</Label>
                <div className="text-sm font-medium">{formatAmount(selectedWithdrawal.amount)}</div>
              </div>

              <div className="space-y-2">
                <Label>{t('withdrawals.process.payment_method')}</Label>
                <div className="text-sm">{selectedWithdrawal.paymentMethod}</div>
              </div>

              <div className="space-y-2">
                <Label>{t('withdrawals.process.account_info')}</Label>
                <div className="text-sm">
                  <div className="font-medium">{selectedWithdrawal.accountName}</div>
                  <div className="text-muted-foreground">{selectedWithdrawal.accountInfo}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">{t('withdrawals.process.status')} *</Label>
                <Select value={processStatus} onValueChange={setProcessStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder={t('withdrawals.process.select_status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROCESSING">{t('withdrawals.processing')}</SelectItem>
                    <SelectItem value="COMPLETED">{t('withdrawals.completed')}</SelectItem>
                    <SelectItem value="FAILED">{t('withdrawals.failed')}</SelectItem>
                    <SelectItem value="CANCELLED">{t('withdrawals.cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {processStatus === 'COMPLETED' && (
                <div className="space-y-2">
                  <Label htmlFor="transactionId">{t('withdrawals.process.transaction_id')} *</Label>
                  <Input
                    id="transactionId"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder={t('withdrawals.process.transaction_id_placeholder')}
                  />
                </div>
              )}

              {processStatus === 'FAILED' && (
                <div className="space-y-2">
                  <Label htmlFor="failureReason">{t('withdrawals.process.failure_reason')} *</Label>
                  <Textarea
                    id="failureReason"
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    placeholder={t('withdrawals.process.failure_reason_placeholder')}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProcessDialog(false)}
              disabled={isProcessing}
            >
              {t('withdrawals.process.cancel')}
            </Button>
            <Button
              onClick={handleProcessWithdrawal}
              disabled={isProcessing || !processStatus}
            >
              {isProcessing ? t('withdrawals.process.processing') : t('withdrawals.process.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

