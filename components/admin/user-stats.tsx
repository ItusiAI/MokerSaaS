"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Users, 
  UserCheck, 
  Shield, 
  CreditCard, 
  Coins, 
  DollarSign, 
  RefreshCw, 
  Search,
  Edit,
  Eye,
  Calendar,
  Mail,
  MoreHorizontal
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
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'

interface User {
  id: string
  name: string | null
  email: string
  emailVerified: string | null
  role: string
  points: number
  purchasedPoints: number
  giftedPoints: number
  subscriptionStatus: string | null
  subscriptionPlan: string | null
  subscriptionCurrentPeriodEnd: string | null
  createdAt: string
  updatedAt: string
}

interface UserStats {
  totalUsers: number
  verifiedUsers: number
  adminUsers: number
  subscribedUsers: number
  totalPoints: number
  totalPayments: number
}

interface UserListResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function UserStats() {
  const t = useTranslations('admin.users')
  const locale = useLocale()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const formatShort = (date: Date) =>
    format(
      date,
      (locale === 'zh' || locale === 'tw' || locale === 'ja' || locale === 'ko') ? 'yyyy年MM月dd日' : 'MMM dd, yyyy',
      { locale: getDateFnsLocale(locale) }
    )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState('all')
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'role' | 'points' | 'subscription' | null>(null)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/users?action=stats')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setStats(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('messages.fetch_stats_failed')
      setError(`${t('messages.fetch_stats_failed')}: ${errorMessage}`)
      console.error('Error fetching stats:', err)
    }
  }

  const fetchUsers = async (targetPage?: number) => {
    const pageToFetch = targetPage ?? page
    try {
      const params = new URLSearchParams({
        action: 'list',
        page: pageToFetch.toString(),
        limit: limit.toString(),
      })
      
      if (search) params.append('search', search)
      if (roleFilter && roleFilter !== 'all') params.append('role', roleFilter)
      if (emailVerifiedFilter && emailVerifiedFilter !== 'all') params.append('emailVerified', emailVerifiedFilter)
      if (subscriptionStatusFilter && subscriptionStatusFilter !== 'all') params.append('subscriptionStatus', subscriptionStatusFilter)

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      const data: UserListResponse = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('messages.fetch_users_failed')
      setError(`${t('messages.fetch_users_failed')}: ${errorMessage}`)
      console.error('Error fetching users:', err)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    await Promise.all([fetchStats(), fetchUsers()])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setPage(1)
    fetchUsers(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, search, roleFilter, emailVerifiedFilter, subscriptionStatusFilter])

  useEffect(() => {
    fetchUsers(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleUpdateUser = async (userId: string, action: string, data: any) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...data }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '更新失败')
      }

      const result = await response.json()
      toast.success(result.message)
      fetchUsers(page)
      setDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新失败')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100)
  }

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.total_users')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.total_users_desc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.verified_users')}</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.verifiedUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.verified_users_desc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.admin_users')}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.adminUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.admin_users_desc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.subscribed_users')}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.subscribedUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.subscribed_users_desc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.total_points')}</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPoints || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.total_points_desc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.total_payments')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalPayments || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.total_payments_desc')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 用户列表 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('user_list.title')}</CardTitle>
            <CardDescription>{t('user_list.description')}</CardDescription>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('actions.refresh')}
          </Button>
        </CardHeader>
        <CardContent>
          {/* 筛选器 */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('user_list.search_placeholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={t('user_list.filter_role')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('user_list.all_roles')}</SelectItem>
                  <SelectItem value="user">{t('user_list.role_user')}</SelectItem>
                  <SelectItem value="admin">{t('user_list.role_admin')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={emailVerifiedFilter} onValueChange={setEmailVerifiedFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={t('user_list.filter_email_status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('user_list.all_statuses')}</SelectItem>
                  <SelectItem value="true">{t('user_list.email_verified')}</SelectItem>
                  <SelectItem value="false">{t('user_list.email_unverified')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={subscriptionStatusFilter} onValueChange={setSubscriptionStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={t('user_list.filter_subscription_status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('user_list.all_subscription_statuses')}</SelectItem>
                  <SelectItem value="active">{t('user_list.subscription_active')}</SelectItem>
                  <SelectItem value="cancelled">{t('user_list.subscription_cancelled')}</SelectItem>
                  <SelectItem value="past_due">{t('user_list.subscription_past_due')}</SelectItem>
                  <SelectItem value="paused">{t('user_list.subscription_paused')}</SelectItem>
                  <SelectItem value="none">{t('user_list.subscription_none')}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={String(limit)}
                onValueChange={(v) => setLimit(parseInt(v, 10))}
              >
                <SelectTrigger className="w-full sm:w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">{t('user_list.page_size_10')}</SelectItem>
                  <SelectItem value="20">{t('user_list.page_size_20')}</SelectItem>
                  <SelectItem value="50">{t('user_list.page_size_50')}</SelectItem>
                  <SelectItem value="100">{t('user_list.page_size_100')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 用户表格 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">{t('user_list.table.user_info')}</TableHead>
                  <TableHead className="min-w-[100px]">{t('user_list.table.role')}</TableHead>
                  <TableHead className="min-w-[120px]">{t('user_list.table.email_status')}</TableHead>
                  <TableHead className="min-w-[160px]">{t('user_list.table.points')}</TableHead>
                  <TableHead className="min-w-[140px]">{t('user_list.table.subscription')}</TableHead>
                  <TableHead className="min-w-[150px]">{t('user_list.table.subscription_expiry')}</TableHead>
                  <TableHead className="min-w-[120px]">{t('user_list.table.created_at')}</TableHead>
                  <TableHead className="min-w-[150px]">{t('user_list.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name || t('user_list.table.no_name')}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                        {user.role === 'admin' ? t('user_list.table.role_admin') : t('user_list.table.role_user')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <Badge variant={user.emailVerified ? 'default' : 'secondary'}>
                          {user.emailVerified ? t('user_list.table.email_verified') : t('user_list.table.email_unverified')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{t('user_list.table.points_total')}: {user.points}</div>
                        <div className="text-muted-foreground text-xs">
                          {t('user_list.table.points_purchased')}: {user.purchasedPoints} | {t('user_list.table.points_gifted')}: {user.giftedPoints}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.subscriptionStatus ? (
                        <Badge variant={user.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                          {t(`user_list.table.plan_${user.subscriptionPlan || 'pro'}`)} - {t(`user_list.table.status_${user.subscriptionStatus}`)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">{t('user_list.table.no_subscription')}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.subscriptionCurrentPeriodEnd ? (
                        <div className="text-sm">
                          <div className="flex items-center whitespace-nowrap">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                            <span>
                              {format(
                                new Date(user.subscriptionCurrentPeriodEnd),
                                (locale === 'zh' || locale === 'tw' || locale === 'ja' || locale === 'ko') ? 'yyyy年MM月dd日' : 'MMM dd, yyyy',
                                { locale: getDateFnsLocale(locale) }
                              )}
                            </span>
                          </div>
                          {new Date(user.subscriptionCurrentPeriodEnd) < new Date() ? (
                            <Badge variant="destructive" className="mt-1 text-xs">{t('user_list.table.expired')}</Badge>
                          ) : new Date(user.subscriptionCurrentPeriodEnd) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? (
                            <Badge variant="secondary" className="mt-1 text-xs">{t('user_list.table.expiring_soon')}</Badge>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center whitespace-nowrap">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm">
                          {format(
                            new Date(user.createdAt),
                            (locale === 'zh' || locale === 'tw' || locale === 'ja' || locale === 'ko') ? 'yyyy年MM月dd日' : 'MMM dd, yyyy',
                            { locale: getDateFnsLocale(locale) }
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setActionType('role')
                            setDialogOpen(true)
                          }}
                          title={t('user_list.table.edit_role')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setActionType('points')
                            setDialogOpen(true)
                          }}
                          title={t('user_list.table.adjust_points')}
                        >
                          <Coins className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setActionType('subscription')
                            setDialogOpen(true)
                          }}
                          title={t('user_list.table.manage_subscription')}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                {t('pagination.page_info', { page: pagination.page, totalPages: pagination.totalPages })} | {t('pagination.total_records', { total: pagination.total })}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  {t('pagination.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  {t('pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 操作对话框 */}
      <UserActionDialog
        user={selectedUser}
        actionType={actionType}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={handleUpdateUser}
      />
    </div>
  )
}

function UserActionDialog({
  user,
  actionType,
  open,
  onOpenChange,
  onUpdate
}: {
  user: User | null
  actionType: 'role' | 'points' | 'subscription' | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (userId: string, action: string, data: any) => void
}) {
  const t = useTranslations('admin.users')
  const locale = useLocale()
  const [role, setRole] = useState('')
  const [points, setPoints] = useState('')
  const [pointsType, setPointsType] = useState('purchased')
  const [description, setDescription] = useState('')
  const formatShort = (date: Date) =>
    format(
      date,
      (locale === 'zh' || locale === 'tw' || locale === 'ja' || locale === 'ko') ? 'yyyy年MM月dd日' : 'MMM dd, yyyy',
      { locale: getDateFnsLocale(locale) }
    )
  const [subscriptionStatus, setSubscriptionStatus] = useState('')
  const [subscriptionPlan, setSubscriptionPlan] = useState('')
  const [subscriptionEndDate, setSubscriptionEndDate] = useState('')

  useEffect(() => {
    if (user && actionType === 'role') {
      setRole(user.role)
    } else if (user && actionType === 'subscription') {
      setSubscriptionStatus(user.subscriptionStatus || '')
      setSubscriptionPlan(user.subscriptionPlan || '')
      setSubscriptionEndDate(
        user.subscriptionCurrentPeriodEnd 
          ? format(new Date(user.subscriptionCurrentPeriodEnd), 'yyyy-MM-dd')
          : ''
      )
      
      // 如果用户已经有active订阅和计划，立即计算续费时间
      if (user.subscriptionStatus === 'active' && user.subscriptionPlan) {
        // 延迟执行以确保状态已设置
        setTimeout(() => {
          calculateEndDate(user.subscriptionPlan!)
        }, 100)
      }
    }
  }, [user, actionType])

  const calculateEndDate = (plan: string) => {
    // 获取当前用户的订阅到期时间，如果没有则使用当前时间
    const currentEndDate = user?.subscriptionCurrentPeriodEnd 
      ? new Date(user.subscriptionCurrentPeriodEnd)
      : new Date()
    
    // 如果当前订阅已过期，则从当前时间开始计算
    const now = new Date()
    const startDate = currentEndDate > now ? currentEndDate : now
    
    // 创建新的结束日期
    const endDate = new Date(startDate)
    
    // 根据计划设置固定时长
    if (plan === 'trial') {
      endDate.setDate(endDate.getDate() + 7) // Trial 7天
    } else if (plan === 'pro') {
      endDate.setMonth(endDate.getMonth() + 1) // Pro 1个月
    } else if (plan === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1) // Annual 1年
    }
    
    // 确保设置正确的日期格式
    const formattedDate = endDate.toISOString().split('T')[0]
    setSubscriptionEndDate(formattedDate)
  }

  const handleSubmit = () => {
    if (!user) return

    if (actionType === 'role') {
      onUpdate(user.id, 'updateRole', { role })
    } else if (actionType === 'points') {
      const pointsValue = parseInt(points)
      
      // 验证赠送积分需要订阅到期时间
      if (pointsType === 'gifted' && pointsValue > 0) {
        if (!user.subscriptionCurrentPeriodEnd) {
          toast.error(t('dialogs.adjust_points.gifted_points_requires_subscription'))
          return
        }
        // 检查订阅是否已过期
        const now = new Date()
        if (new Date(user.subscriptionCurrentPeriodEnd) < now) {
          toast.error(t('dialogs.adjust_points.subscription_expired_error') || '用户订阅已过期，无法添加赠送积分')
          return
        }
      }
      
      onUpdate(user.id, 'adjustPoints', { 
        points: pointsValue, 
        pointsType, 
        description 
      })
    } else if (actionType === 'subscription') {
      onUpdate(user.id, 'updateSubscription', { 
        subscriptionStatus, 
        subscriptionPlan, 
        subscriptionEndDate 
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {actionType === 'role' ? t('dialogs.edit_role.title') : 
             actionType === 'points' ? t('dialogs.adjust_points.title') : 
             t('dialogs.manage_subscription.title')}
          </DialogTitle>
          <DialogDescription>
            {t('dialogs.user_info', { name: user?.name || t('dialogs.no_name'), email: user?.email || '' })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {actionType === 'role' && (
            <div>
              <Label htmlFor="role">{t('dialogs.edit_role.role_label')}</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder={t('dialogs.edit_role.role_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t('dialogs.edit_role.role_user')}</SelectItem>
                  <SelectItem value="admin">{t('dialogs.edit_role.role_admin')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {actionType === 'points' && (
            <>
              <div>
                <Label htmlFor="points">{t('dialogs.adjust_points.points_label')}</Label>
                <Input
                  id="points"
                  type="number"
                  placeholder={t('dialogs.adjust_points.points_placeholder')}
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="pointsType">{t('dialogs.adjust_points.points_type_label')}</Label>
                <Select value={pointsType} onValueChange={setPointsType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchased">{t('dialogs.adjust_points.points_type_purchased')}</SelectItem>
                    <SelectItem value="gifted">{t('dialogs.adjust_points.points_type_gifted')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {pointsType === 'purchased' && (
                <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                  {t('dialogs.adjust_points.purchased_points_info')}
                </div>
              )}
              {pointsType === 'gifted' && (
                <div className="space-y-2">
                  {user?.subscriptionCurrentPeriodEnd ? (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                        <span className="text-blue-900 dark:text-blue-100 font-medium">
                          {t('dialogs.adjust_points.gifted_points_expiry_label')}:
                        </span>
                        <span className="ml-2 text-blue-700 dark:text-blue-300">
                          {format(
                            new Date(user.subscriptionCurrentPeriodEnd),
                            (locale === 'zh' || locale === 'tw' || locale === 'ja' || locale === 'ko') ? 'yyyy年MM月dd日' : 'MMM dd, yyyy',
                            { locale: getDateFnsLocale(locale) }
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
                        {t('dialogs.adjust_points.gifted_points_expiry_info')}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-900 dark:text-yellow-100 font-medium">
                        {t('dialogs.adjust_points.gifted_points_requires_subscription')}
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        {t('dialogs.adjust_points.gifted_points_no_subscription')}
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div>
                <Label htmlFor="description">{t('dialogs.adjust_points.description_label')}</Label>
                <Textarea
                  id="description"
                  placeholder={t('dialogs.adjust_points.description_placeholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </>
          )}

          {actionType === 'subscription' && (
            <>
              <div>
                <Label htmlFor="subscriptionStatus">{t('dialogs.manage_subscription.status_label')}</Label>
                <Select value={subscriptionStatus} onValueChange={(value) => {
                  setSubscriptionStatus(value)
                  // 当状态设为active且已选择计划时，自动计算到期时间
                  if (value === 'active' && subscriptionPlan) {
                    calculateEndDate(subscriptionPlan)
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('dialogs.manage_subscription.status_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('dialogs.manage_subscription.status_active')}</SelectItem>
                    <SelectItem value="cancelled">{t('dialogs.manage_subscription.status_cancelled')}</SelectItem>
                    <SelectItem value="past_due">{t('dialogs.manage_subscription.status_past_due')}</SelectItem>
                    <SelectItem value="paused">{t('dialogs.manage_subscription.status_paused')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subscriptionPlan">{t('dialogs.manage_subscription.plan_label')}</Label>
                <Select value={subscriptionPlan} onValueChange={(value) => {
                  setSubscriptionPlan(value)
                  // 自动计算到期时间 - 无论是否已经选择过，都重新计算
                  if (value && subscriptionStatus === 'active') {
                    calculateEndDate(value)
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('dialogs.manage_subscription.plan_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">{t('dialogs.manage_subscription.plan_trial')}</SelectItem>
                    <SelectItem value="pro">{t('dialogs.manage_subscription.plan_pro')}</SelectItem>
                    <SelectItem value="annual">{t('dialogs.manage_subscription.plan_annual')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {subscriptionStatus === 'active' && subscriptionPlan && (
                <div>
                  <Label>{t('dialogs.manage_subscription.end_date_label')}</Label>
                  <div className="p-2 bg-muted rounded-md text-sm">
                    {subscriptionEndDate ? 
                      format(new Date(subscriptionEndDate), (locale === 'zh' || locale === 'tw' || locale === 'ja' || locale === 'ko') ? 'yyyy年MM月dd日' : 'MMM dd, yyyy', { locale: getDateFnsLocale(locale) }) : 
                      t('dialogs.manage_subscription.select_plan_first')
                    }
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user?.subscriptionCurrentPeriodEnd && new Date(user.subscriptionCurrentPeriodEnd) > new Date() 
                      ? t('dialogs.manage_subscription.cumulative_calculated')
                      : t('dialogs.manage_subscription.auto_calculated')
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('dialogs.cancel')}
          </Button>
          <Button onClick={handleSubmit}>
            {t('dialogs.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
