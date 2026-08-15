'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Copy, 
  Check,
  Link as LinkIcon,
  Award,
  Calendar,
  Sparkles,
  Info,
  Clock,
  CheckCircle,
  XCircle,
  Wallet,
  ArrowDownCircle,
  Mail,
  User
} from 'lucide-react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { format } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { useLocale } from 'next-intl'

interface AffiliateStats {
  code: string
  codeChanged: boolean
  canEdit: boolean
  balance: number
  frozenBalance: number
  totalRelations: number
  convertedRelations: number
  totalEarnings: number
  releasedEarnings: number
  frozenEarnings: number
}

export default function AffiliatePageClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const t = useTranslations('affiliate_page')
  const locale = useLocale()
  
  const [customCode, setCustomCode] = useState('')
  const [currentCode, setCurrentCode] = useState('')
  const [canEdit, setCanEdit] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [relations, setRelations] = useState<any[]>([])
  const [earnings, setEarnings] = useState<any[]>([])
  const [relationsPage, setRelationsPage] = useState(1)
  const [earningsPage, setEarningsPage] = useState(1)
  const [loadingRelations, setLoadingRelations] = useState(false)
  const [loadingEarnings, setLoadingEarnings] = useState(false)
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('alipay')
  const [accountName, setAccountName] = useState('')
  const [accountInfo, setAccountInfo] = useState('')
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  
  // 筛选状态
  const [relationFilter, setRelationFilter] = useState<'all' | 'converted' | 'pending' | 'expired'>('all')
  const [earningFilter, setEarningFilter] = useState<'all' | 'FROZEN' | 'RELEASED' | 'CANCELLED'>('all')
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'>('all')

  // 如果未登录，重定向到登录页
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // 获取推广统计数据
  useEffect(() => {
    if (session?.user?.id) {
      fetchAffiliateStats()
      fetchRelations()
      fetchEarnings()
      fetchWithdrawals()
    }
  }, [session])

  const fetchAffiliateStats = async () => {
    try {
      const response = await fetch('/api/affiliate/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setCurrentCode(data.stats.code || '')
        setCanEdit(data.stats.canEdit)
      }
    } catch (error) {
      console.error('Error fetching affiliate stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCode = async () => {
    if (!customCode.trim()) {
      toast.error(t('code_setting.enter_code'))
      return
    }

    const trimmedCode = customCode.trim()
    if (trimmedCode.length < 4 || trimmedCode.length > 20) {
      toast.error(t('code_setting.invalid_format'))
      return
    }
    
    if (!/^[A-Za-z0-9]+$/.test(trimmedCode)) {
      toast.error(t('code_setting.invalid_format'))
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch('/api/affiliate/update-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: customCode.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(t('code_setting.update_success'))
        setCurrentCode(data.code)
        setCustomCode('')
        setCanEdit(false)
        fetchAffiliateStats()
      } else {
        // 根据错误码显示对应的翻译
        const errorKey = data.error || 'UPDATE_FAILED'
        const errorMessages: Record<string, string> = {
          'CODE_EMPTY': t('code_setting.enter_code'),
          'INVALID_FORMAT': t('code_setting.invalid_format'),
          'CODE_ALREADY_TAKEN': t('code_setting.already_taken'),
          'CODE_ALREADY_CHANGED': t('code_setting.already_changed'),
          'UPDATE_FAILED': t('code_setting.update_failed'),
        }
        toast.error(errorMessages[errorKey] || t('code_setting.update_failed'))
      }
    } catch (error) {
      console.error('Error updating affiliate code:', error)
      toast.error(t('code_setting.update_failed'))
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
        toast.success(t('code_setting.code_copied'))
      } else {
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
        toast.success(t('code_setting.link_copied'))
      }
    } catch (error) {
      toast.error(t('code_setting.copy_failed'))
    }
  }

  const affiliateLink = currentCode 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/signup?aff=${currentCode}`
    : ''

  // 日期格式化函数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (locale === 'zh') {
      return format(date, 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
    } else {
      return format(date, 'MMM dd, yyyy HH:mm', { locale: enUS })
    }
  }

  // 金额格式化函数
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount / 100)
  }

  // 筛选后的数据
  const filteredRelations = relations.filter((relation) => {
    if (relationFilter === 'all') return true
    if (relationFilter === 'converted') return relation.hasConverted
    if (relationFilter === 'pending') return !relation.hasConverted && !relation.isExpired
    if (relationFilter === 'expired') return relation.isExpired
    return true
  })

  const filteredEarnings = earnings.filter((earning) => {
    if (earningFilter === 'all') return true
    return earning.status === earningFilter
  })

  const filteredWithdrawals = withdrawals.filter((withdrawal) => {
    if (withdrawalFilter === 'all') return true
    return withdrawal.status === withdrawalFilter
  })

  const fetchRelations = async (page = 1) => {
    setLoadingRelations(true)
    try {
      const response = await fetch(`/api/affiliate/relations?page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setRelations(data.data)
      }
    } catch (error) {
      console.error('Error fetching relations:', error)
    } finally {
      setLoadingRelations(false)
    }
  }

  const fetchEarnings = async (page = 1) => {
    setLoadingEarnings(true)
    try {
      const response = await fetch(`/api/affiliate/earnings?page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setEarnings(data.data)
      }
    } catch (error) {
      console.error('Error fetching earnings:', error)
    } finally {
      setLoadingEarnings(false)
    }
  }

  const fetchWithdrawals = async (page = 1) => {
    setLoadingWithdrawals(true)
    try {
      const response = await fetch(`/api/affiliate/withdrawals?page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setWithdrawals(data.data)
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    } finally {
      setLoadingWithdrawals(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    const availableBalance = (stats?.balance || 0) / 100
    
    if (!amount || amount < 10) {
      toast.error(t('withdraw.min_amount_error'))
      return
    }

    if (amount > availableBalance) {
      toast.error(t('withdraw.exceeds_balance'))
      return
    }

    if (!accountName.trim()) {
      toast.error(t('withdraw.account_name_required'))
      return
    }

    if (!accountInfo.trim()) {
      toast.error(t('withdraw.account_info_required'))
      return
    }

    setIsWithdrawing(true)
    try {
      const response = await fetch('/api/affiliate/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentMethod,
          accountName: accountName.trim(),
          accountInfo: accountInfo.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(t('withdraw.success'))
        setShowWithdrawModal(false)
        setWithdrawAmount('')
        setAccountName('')
        setAccountInfo('')
        fetchAffiliateStats()
        fetchWithdrawals()
      } else {
        const errorMessages: Record<string, string> = {
          'INVALID_AMOUNT': t('withdraw.invalid_amount'),
          'INVALID_PAYMENT_METHOD': t('withdraw.invalid_payment_method'),
          'INVALID_ACCOUNT_NAME': t('withdraw.account_name_required'),
          'INVALID_ACCOUNT_INFO': t('withdraw.account_info_required'),
          'MIN_AMOUNT_NOT_MET': t('withdraw.min_amount_error'),
          'INSUFFICIENT_BALANCE': t('withdraw.insufficient_balance'),
          'WITHDRAWAL_FAILED': t('withdraw.failed'),
        }
        toast.error(errorMessages[data.error] || t('withdraw.failed'))
      }
    } catch (error) {
      console.error('Error creating withdrawal:', error)
      toast.error(t('withdraw.failed'))
    } finally {
      setIsWithdrawing(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container max-w-6xl mx-auto pt-20 pb-8 px-4">
        <div className="text-center">
          <p className="text-muted-foreground">{t('loading')}</p>
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
                  {stats?.totalRelations || 0}
                </p>
              </div>
              <Users className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('stats.converted')}</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats?.convertedRelations || 0}
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{t('stats.available_balance')}</p>
                <p className="text-3xl font-bold text-yellow-600">
                  ${((stats?.balance || 0) / 100).toFixed(2)}
                </p>
                <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="mt-2">
                      <ArrowDownCircle className="h-4 w-4 mr-1" />
                      {t('withdraw.button')}
                    </Button>
                  </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('withdraw.title')}</DialogTitle>
                        <DialogDescription>{t('withdraw.description')}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>{t('withdraw.amount')}</Label>
                          <Input
                            type="number"
                            placeholder={t('withdraw.amount_placeholder')}
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            min={10}
                            max={stats ? (stats.balance / 100) : undefined}
                            step="0.01"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('withdraw.min_amount')}: $10 | {t('withdraw.available_balance')}: ${((stats?.balance || 0) / 100).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <Label>{t('withdraw.payment_method')}</Label>
                          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="alipay">{t('withdraw.alipay')}</SelectItem>
                              <SelectItem value="paypal">{t('withdraw.paypal')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>{t('withdraw.account_name')}</Label>
                          <Input
                            placeholder={t('withdraw.account_name_placeholder')}
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>
                            {paymentMethod === 'alipay' && t('withdraw.alipay_account')}
                            {paymentMethod === 'paypal' && t('withdraw.paypal_email')}
                          </Label>
                          <Input
                            placeholder={
                              paymentMethod === 'alipay' ? t('withdraw.alipay_placeholder') :
                              t('withdraw.paypal_placeholder')
                            }
                            value={accountInfo}
                            onChange={(e) => setAccountInfo(e.target.value)}
                          />
                        </div>
                        <Button
                          onClick={handleWithdraw}
                          disabled={
                            isWithdrawing || 
                            !withdrawAmount || 
                            !accountName || 
                            !accountInfo ||
                            parseFloat(withdrawAmount) < 10 ||
                            (stats ? parseFloat(withdrawAmount) > (stats.balance / 100) : false)
                          }
                          className="w-full"
                        >
                          {isWithdrawing ? t('withdraw.processing') : t('withdraw.submit')}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
              </div>
              <DollarSign className="h-10 w-10 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('stats.frozen_balance')}</p>
                <p className="text-3xl font-bold text-purple-600">
                  ${((stats?.frozenBalance || 0) / 100).toFixed(2)}
                </p>
              </div>
              <Clock className="h-10 w-10 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 推广码设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>{t('code_setting.title')}</span>
            </CardTitle>
            <CardDescription>{t('code_setting.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentCode ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('code_setting.current_code')}
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
                      placeholder={t('code_setting.placeholder')}
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value)}
                      minLength={4}
                      maxLength={20}
                      className="font-mono"
                    />
                    <Button
                      onClick={handleUpdateCode}
                      disabled={isUpdating || !customCode.trim()}
                      className="w-full"
                    >
                      {isUpdating ? t('code_setting.updating') : t('code_setting.button_update')}
                    </Button>
                    <div className="flex items-start space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <p className="text-sm text-yellow-600">
                        {t('code_setting.note')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-2 p-3 bg-muted/50 rounded-lg">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {t('code_setting.already_changed')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  placeholder={t('code_setting.placeholder_set')}
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  minLength={4}
                  maxLength={20}
                  className="font-mono"
                />
                <Button
                  onClick={handleUpdateCode}
                  disabled={isUpdating || !customCode.trim()}
                  className="w-full"
                >
                  {isUpdating ? t('code_setting.setting') : t('code_setting.button_set')}
                </Button>
                <div className="flex items-start space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-600">
                    {t('code_setting.note')}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 分享推广 */}
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
                    {t('share.link_label')}
                  </label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input value={affiliateLink} readOnly className="text-sm" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(affiliateLink, 'link')}
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
                    onClick={() => copyToClipboard(affiliateLink, 'link')}
                    className="w-full"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    {t('share.copy_link')}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">{t('code_setting.set_first')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 邀请数据 */}
      <Card className="bg-secondary/80 border-primary/30 cyber-glow-subtle">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="w-5 h-5 text-primary" />
              {t('relations.title')}
            </CardTitle>
            <Select value={relationFilter} onValueChange={(value: any) => setRelationFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('relations.filter_all')}</SelectItem>
                <SelectItem value="converted">{t('relations.converted')}</SelectItem>
                <SelectItem value="pending">{t('relations.pending')}</SelectItem>
                <SelectItem value="expired">{t('relations.expired')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardDescription>{t('relations.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRelations ? (
            <div className="text-center py-8 text-muted-foreground">{t('relations.loading')}</div>
          ) : filteredRelations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50 text-primary" />
              <p>{t('relations.empty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('relations.table.user')}</TableHead>
                    <TableHead>{t('relations.table.email')}</TableHead>
                    <TableHead>{t('relations.table.register_time')}</TableHead>
                    <TableHead>{t('relations.table.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRelations.map((relation) => (
                    <TableRow key={relation.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          <span className="font-medium text-foreground">
                            {relation.invitee?.name || t('relations.unknown_user')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {relation.invitee?.email || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(relation.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {relation.hasConverted ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {t('relations.converted')}
                          </Badge>
                        ) : relation.isExpired ? (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 佣金记录 */}
      <Card className="bg-secondary/80 border-primary/30 cyber-glow-subtle">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <DollarSign className="w-5 h-5 text-primary" />
              {t('earnings.title')}
            </CardTitle>
            <Select value={earningFilter} onValueChange={(value: any) => setEarningFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('earnings.filter_all')}</SelectItem>
                <SelectItem value="FROZEN">{t('earnings.frozen')}</SelectItem>
                <SelectItem value="RELEASED">{t('earnings.released')}</SelectItem>
                <SelectItem value="CANCELLED">{t('earnings.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardDescription>{t('earnings.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingEarnings ? (
            <div className="text-center py-8 text-muted-foreground">{t('earnings.loading')}</div>
          ) : filteredEarnings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50 text-primary" />
              <p>{t('earnings.empty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('earnings.table.amount')}</TableHead>
                    <TableHead>{t('earnings.table.from')}</TableHead>
                    <TableHead>{t('earnings.table.status')}</TableHead>
                    <TableHead>{t('earnings.table.create_time')}</TableHead>
                    <TableHead>{t('earnings.table.release_time')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEarnings.map((earning) => (
                    <TableRow key={earning.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <span className="font-medium text-foreground">
                            {formatAmount(earning.amount)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {earning.invitee?.name || earning.invitee?.email || t('earnings.unknown_user')}
                          </span>
                        </div>
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
                        <div className="text-sm">
                          {formatDate(earning.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {earning.releaseDate ? (
                          <div className="text-sm">
                            {formatDate(earning.releaseDate)}
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
          )}
        </CardContent>
      </Card>

      {/* 提现记录 */}
      <Card className="bg-secondary/80 border-primary/30 cyber-glow-subtle">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Wallet className="w-5 h-5 text-primary" />
              {t('withdrawals.title')}
            </CardTitle>
            <Select value={withdrawalFilter} onValueChange={(value: any) => setWithdrawalFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('withdrawals.filter_all')}</SelectItem>
                <SelectItem value="PENDING">{t('withdrawals.pending')}</SelectItem>
                <SelectItem value="PROCESSING">{t('withdrawals.processing')}</SelectItem>
                <SelectItem value="COMPLETED">{t('withdrawals.completed')}</SelectItem>
                <SelectItem value="FAILED">{t('withdrawals.failed')}</SelectItem>
                <SelectItem value="CANCELLED">{t('withdrawals.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardDescription>{t('withdrawals.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingWithdrawals ? (
            <div className="text-center py-8 text-muted-foreground">{t('withdrawals.loading')}</div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50 text-primary" />
              <p>{t('withdrawals.empty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('withdrawals.table.amount')}</TableHead>
                    <TableHead>{t('withdrawals.table.payment_method')}</TableHead>
                    <TableHead>{t('withdrawals.table.account')}</TableHead>
                    <TableHead>{t('withdrawals.table.status')}</TableHead>
                    <TableHead>{t('withdrawals.table.create_time')}</TableHead>
                    <TableHead>{t('withdrawals.table.processed_time')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWithdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <span className="font-medium text-foreground">
                            {formatAmount(withdrawal.amount)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {withdrawal.paymentMethod === 'alipay' ? (
                            <>
                              <Wallet className="w-4 h-4 text-blue-500" />
                              <span className="text-sm">{t('withdraw.alipay')}</span>
                            </>
                          ) : (
                            <>
                              <Wallet className="w-4 h-4 text-blue-600" />
                              <span className="text-sm">{t('withdraw.paypal')}</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {withdrawal.accountName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {withdrawal.accountInfo}
                          </div>
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
                          <div className="text-xs text-red-500 mt-1">
                            {withdrawal.failureReason}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(withdrawal.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {withdrawal.processedAt ? (
                          <div className="text-sm">
                            {formatDate(withdrawal.processedAt)}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}

