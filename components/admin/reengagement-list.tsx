"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  Copy,
  Clock,
  AlertCircle,
  UserPlus,
  ExternalLink,
  Download,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { zhCN, enUS, ja as jaLocale, ko as koLocale } from 'date-fns/locale'
import type { Locale as DateFnsLocale } from 'date-fns/locale'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'

const APP_DATE_FNS_LOCALE: Record<string, DateFnsLocale> = {
  zh: zhCN,
  ja: jaLocale,
  ko: koLocale,
}
function getDateFnsLocale(locale: string | undefined | null): DateFnsLocale {
  return APP_DATE_FNS_LOCALE[locale || ''] || enUS
}

type DormantBucket = 'active' | 'warm' | 'dormant' | 'inactive' | 'churned'

interface DormantUserRow {
  id: string
  email: string
  name: string | null
  preferredLanguage: string | null
  role: string | null
  points: number | null
  subscriptionStatus: string | null
  subscriptionPlan: string | null
  subscriptionCurrentPeriodEnd: string | null
  updatedAt: string | null
  createdAt: string | null
  inactiveDays: number
  bucket: DormantBucket
  emailVerified: boolean
}

interface DormantStats {
  totalUsers: number
  inactiveSignups: number    // 未激活账号(updatedAt IS NULL,邮箱已验证)
  active: number
  warm: number
  dormant: number
  inactive: number
  churned: number
  dormantTotal: number
  dormantPaidHistory: number
}

interface DormantListResponse {
  rows: DormantUserRow[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
  mode: 'dormant' | 'inactive_signups'
  stats: DormantStats
}

const BUCKET_VARIANT: Record<DormantBucket, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  warm: 'secondary',
  dormant: 'outline',
  inactive: 'destructive',
  churned: 'destructive',
}

const LOCALE_LABEL_KEY: Record<string, string> = {
  zh: 'chinese',
  en: 'english',
  ja: 'japanese',
  ko: 'korean',
  tw: 'traditionalChinese',
}

function languageLabel(locale: string, t: ReturnType<typeof useTranslations<string>>): string {
  const key = LOCALE_LABEL_KEY[locale]
  if (!key) return locale.toUpperCase()
  try {
    return t.has(`lang.${key}` as any) ? t(`lang.${key}` as any) : locale.toUpperCase()
  } catch {
    return locale.toUpperCase()
  }
}

// 订阅状态 Badge 颜色
function subscriptionBadgeVariant(status: string | null): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (!status) return 'outline'
  if (status === 'active') return 'default'
  if (status === 'cancelled' || status === 'canceled') return 'secondary'
  if (status === 'past_due' || status === 'unpaid') return 'destructive'
  return 'outline'
}

function formatPoints(n: number | null) {
  if (n === null || n === undefined) return '—'
  return n.toLocaleString('en-US')
}

// ========== CSV 工具函数 ==========

// 转义 CSV 字段:含, " 换行的字段用双引号包裹,内部 " 替换成 ""
function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // 含逗号、双引号、换行符、回车符都需要引号包裹
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// 生成 CSV 内容(带 BOM,解决 Excel 打开中文乱码)
function buildCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines: string[] = []
  lines.push(headers.map(escapeCsvField).join(','))
  for (const row of rows) {
    lines.push(row.map(escapeCsvField).join(','))
  }
  // \uFEFF 是 UTF-8 BOM,Excel 打开 UTF-8 CSV 必须加这个
  return '\uFEFF' + lines.join('\r\n')
}

// 触发浏览器下载 CSV 文件
function downloadCsv(filename: string, csvContent: string) {
  // 使用 Blob + URL.createObjectURL
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // 释放 URL
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

// 从前端筛参数构造文件名,例如 dormant_paid_2026-08-20.csv
function buildExportFilename(prefix: string): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${prefix}_${yyyy}-${mm}-${dd}.csv`
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  try {
    return format(new Date(iso), 'yyyy-MM-dd HH:mm')
  } catch {
    return iso
  }
}

interface UsersTableProps {
  rows: DormantUserRow[]
  t: ReturnType<typeof useTranslations<string>>
  dateLocale: DateFnsLocale
  onCopy: (text: string, label: string) => void
  emptyText: string
  showInactiveDays?: boolean
}

function DormantUsersTable({
  rows,
  t,
  dateLocale,
  onCopy,
  emptyText,
  showInactiveDays = true,
}: UsersTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">{t('table.user')}</TableHead>
            {showInactiveDays && (
              <TableHead className="w-[100px]">{t('table.inactive_days')}</TableHead>
            )}
            <TableHead className="w-[110px]">{t('table.subscription')}</TableHead>
            <TableHead className="w-[80px]">{t('table.points')}</TableHead>
            <TableHead className="w-[80px]">{t('table.lang')}</TableHead>
            <TableHead className="w-[150px]">{t('table.last_active')}</TableHead>
            <TableHead className="w-[110px]">{t('table.created')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={showInactiveDays ? 7 : 6}
                className="text-center text-sm text-muted-foreground py-8"
              >
                {emptyText}
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">
                    {row.name || row.email.split('@')[0]}
                  </span>
                  <button
                    type="button"
                    onClick={() => onCopy(row.email, t('labels.email'))}
                    className="text-xs text-muted-foreground hover:text-primary text-left"
                  >
                    {row.email}
                  </button>
                  {!row.emailVerified && (
                    <Badge variant="outline" className="mt-1 w-fit text-[10px]">
                      {t('labels.unverified')}
                    </Badge>
                  )}
                </div>
              </TableCell>
              {showInactiveDays && (
                <TableCell>
                  <span className="font-mono text-sm font-semibold">
                    {row.inactiveDays}
                    <span className="text-xs text-muted-foreground ml-0.5">d</span>
                  </span>
                </TableCell>
              )}
              <TableCell>
                {row.subscriptionStatus ? (
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant={subscriptionBadgeVariant(row.subscriptionStatus)}
                      className="w-fit"
                    >
                      {row.subscriptionPlan || row.subscriptionStatus}
                    </Badge>
                    {row.subscriptionCurrentPeriodEnd && (
                      <span className="text-[10px] text-muted-foreground">
                        {t('labels.expires')} {formatDateTime(row.subscriptionCurrentPeriodEnd)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-sm">{formatPoints(row.points)}</TableCell>
              <TableCell>
                {row.preferredLanguage ? (
                  <Badge variant="outline">
                    {languageLabel(row.preferredLanguage, t)}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {row.updatedAt
                  ? (() => {
                      try {
                        return formatDistanceToNow(new Date(row.updatedAt), {
                          addSuffix: true,
                          locale: dateLocale,
                        })
                      } catch {
                        return row.updatedAt
                      }
                    })()
                  : '—'}
              </TableCell>
              <TableCell className="text-xs whitespace-nowrap">
                {formatDateTime(row.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ========== 未激活账号 Dialog 子组件 ==========
interface InactiveSignupsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  t: ReturnType<typeof useTranslations<string>>
  locale: string
}

function InactiveSignupsDialog({
  open,
  onOpenChange,
  t,
  locale,
}: InactiveSignupsDialogProps) {
  const dateLocale = getDateFnsLocale(locale)
  const [data, setData] = useState<DormantListResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [exporting, setExporting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        mode: 'inactive_signups',
        page: String(page),
        limit: String(limit),
      })
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/reengagement?${params.toString()}`)
      if (!res.ok) throw new Error('fetch_failed')
      const json: DormantListResponse = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
      toast.error(t('error.fetch_failed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, page, limit, search])

  const onSearch = () => {
    setPage(1)
    setSearch(searchInput.trim())
  }

  // ========== 导出 CSV ==========
  const onExportCsv = async () => {
    if (exporting) return
    setExporting(true)
    const buildParams = (page: number) => {
      const params = new URLSearchParams({
        mode: 'inactive_signups',
        page: String(page),
        limit: '100', // API 硬上限 100
      })
      if (search) params.set('search', search)
      return params
    }

    const progressToast = toast.loading(t('export_preparing'))

    try {
      // 第 1 页
      const firstRes = await fetch(`/api/admin/reengagement?${buildParams(1).toString()}`)
      if (!firstRes.ok) throw new Error('fetch_failed')
      const firstJson: DormantListResponse = await firstRes.json()

      const total = firstJson.pagination.total
      const totalPages = firstJson.pagination.totalPages

      if (total === 0) {
        toast.dismiss(progressToast)
        toast.warning(t('export_empty'))
        return
      }

      const allRows: DormantUserRow[] = [...firstJson.rows]

      if (totalPages > 1) {
        const CONCURRENCY = 4
        for (let start = 2; start <= totalPages; start += CONCURRENCY) {
          const group = []
          for (let p = start; p < Math.min(start + CONCURRENCY, totalPages + 1); p++) {
            group.push(
              fetch(`/api/admin/reengagement?${buildParams(p).toString()}`)
                .then((r) => {
                  if (!r.ok) throw new Error('fetch_failed')
                  return r.json() as Promise<DormantListResponse>
                })
                .then((j) => allRows.push(...j.rows))
            )
          }
          await Promise.all(group)
          toast.loading(
            t('export_progress', { fetched: allRows.length, total }),
            { id: progressToast }
          )
        }
      }
      toast.dismiss(progressToast)

      const headers = [
        t('table.user'),
        'Email',
        t('table.subscription'),
        t('table.points'),
        t('table.lang'),
        t('table.last_active'),
        t('table.created'),
      ]

      const lines = allRows.map((row) => [
        row.name || '',
        row.email,
        row.subscriptionStatus || '',
        row.subscriptionPlan || '',
        row.subscriptionCurrentPeriodEnd || '',
        row.points ?? '',
        row.preferredLanguage || '',
        row.updatedAt || '',
        row.createdAt || '',
      ])

      const csv = buildCsv(headers, lines)
      const filename = buildExportFilename('inactive_signups_export')
      downloadCsv(filename, csv)
      toast.success(t('exported', { count: allRows.length }))
    } catch (err) {
      console.error(err)
      toast.dismiss(progressToast)
      toast.error(t('error.export_failed'))
    } finally {
      setExporting(false)
    }
  }

  const onCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t('copied', { value: label }))
    } catch {
      toast.error(t('error.copy_failed'))
    }
  }

  const pagination = data?.pagination

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-sky-600" />
            {t('dialog.inactive_signups_title')}
          </DialogTitle>
          <DialogDescription>
            {t('dialog.inactive_signups_desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2 flex items-center gap-2">
          <Input
            placeholder={t('search_placeholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch()
            }}
            className="w-[240px]"
          />
          <Button onClick={onSearch} size="sm" disabled={loading}>
            {t('search_button')}
          </Button>
          <Select
            value={String(limit)}
            onValueChange={(v) => {
              setPage(1)
              setLimit(parseInt(v, 10))
            }}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">{t('filter.page_size_10')}</SelectItem>
              <SelectItem value="20">{t('filter.page_size_20')}</SelectItem>
              <SelectItem value="50">{t('filter.page_size_50')}</SelectItem>
              <SelectItem value="100">{t('filter.page_size_100')}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPage(1)
              setSearchInput('')
              setSearch('')
              setLimit(10)
            }}
          >
            {t('reset')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onExportCsv}
            disabled={exporting || loading}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="ml-1">{t('export_csv')}</span>
          </Button>
          <div className="ml-auto text-sm text-muted-foreground">
            {t('dialog.total_count', { count: pagination?.total ?? 0 })}
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 pb-6">
          {loading && !data ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <DormantUsersTable
                rows={data?.rows || []}
                t={t}
                dateLocale={dateLocale}
                onCopy={onCopy}
                emptyText={t('dialog.no_inactive_signups')}
                showInactiveDays={false}
              />
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t p-3 text-sm mt-2">
                  <div className="text-muted-foreground">
                    {t('pagination.summary', {
                      from: (pagination.page - 1) * pagination.limit + 1,
                      to: Math.min(pagination.page * pagination.limit, pagination.total),
                      total: pagination.total,
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, pagination.page - 1))}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t('pagination.prev')}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage(Math.min(pagination.totalPages, pagination.page + 1))
                      }
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      {t('pagination.next')}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ========== 顶部统计卡片（点击可交互） ==========
interface StatCardProps {
  title: string
  value: number | undefined
  hint?: string
  icon?: React.ReactNode
  valueClassName?: string
  onClick?: () => void
  clickHint?: string
}

function StatCard({ title, value, hint, icon, valueClassName, onClick, clickHint }: StatCardProps) {
  const interactive = !!onClick
  return (
    <Card
      className={
        interactive
          ? 'cursor-pointer transition-all hover:bg-accent/40 hover:border-primary/40 hover:shadow-sm'
          : ''
      }
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium">{title}</CardTitle>
        {icon || (interactive && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />)}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClassName || ''}`}>{value ?? 0}</div>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        {interactive && clickHint && (
          <p className="text-[10px] text-primary mt-0.5">{clickHint}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ========== 主组件 ==========
export function ReengagementList() {
  const t = useTranslations('admin.reengagement')
  const locale = useLocale()
  const dateLocale = getDateFnsLocale(locale)

  const [data, setData] = useState<DormantListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [bucket, setBucket] = useState<string>('')
  const [lang, setLang] = useState<string>('')
  const [subscription, setSubscription] = useState<string>('')
  const [sort, setSort] = useState<string>('inactive_desc')
  const [inactiveSignupsOpen, setActiveSubscribersOpen] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort,
      })
      if (search) params.set('search', search)
      if (bucket) params.set('bucket', bucket)
      if (lang) params.set('locale', lang)
      if (subscription) params.set('subscription', subscription)

      const res = await fetch(`/api/admin/reengagement?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'fetch_failed')
      }
      const json: DormantListResponse = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
      toast.error(t('error.fetch_failed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, bucket, lang, subscription, sort])

  const onSearch = () => {
    setPage(1)
    setSearch(searchInput.trim())
  }
  const onReset = () => {
    setPage(1)
    setSearchInput('')
    setSearch('')
    setBucket('')
    setLang('')
    setSubscription('')
    setSort('inactive_desc')
    setLimit(10)
  }

  // ========== 导出 CSV ==========
  const [exporting, setExporting] = useState(false)
  const onExportCsv = async () => {
    if (exporting) return
    setExporting(true)
    // 计算通用 params(不分页),所有页都共用
    const buildParams = (page: number) => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '100', // API 硬上限 100
        sort,
      })
      if (search) params.set('search', search)
      if (bucket) params.set('bucket', bucket)
      if (lang) params.set('locale', lang)
      if (subscription) params.set('subscription', subscription)
      return params
    }

    // 用 sonner 的 loading toast 实时显示进度
    const progressToast = toast.loading(t('export_preparing'))

    try {
      // 请求第 1 页,获取 total
      const firstRes = await fetch(`/api/admin/reengagement?${buildParams(1).toString()}`)
      if (!firstRes.ok) throw new Error('fetch_failed')
      const firstJson: DormantListResponse = await firstRes.json()

      const total = firstJson.pagination.total
      const totalPages = firstJson.pagination.totalPages

      if (total === 0) {
        toast.dismiss(progressToast)
        toast.warning(t('export_empty'))
        return
      }

      const allRows: DormantUserRow[] = [...firstJson.rows]

      // 如果只有 1 页,直接收尾
      if (totalPages <= 1) {
        toast.dismiss(progressToast)
      } else {
        // 后续页并行拉取(并发 4 个,避免一次打太多请求)
        const CONCURRENCY = 4
        for (let start = 2; start <= totalPages; start += CONCURRENCY) {
          if (!exporting) break
          const group = []
          for (let p = start; p < Math.min(start + CONCURRENCY, totalPages + 1); p++) {
            group.push(
              fetch(`/api/admin/reengagement?${buildParams(p).toString()}`)
                .then((r) => {
                  if (!r.ok) throw new Error('fetch_failed')
                  return r.json() as Promise<DormantListResponse>
                })
                .then((j) => allRows.push(...j.rows))
            )
          }
          await Promise.all(group)
          // 更新进度条
          const fetched = allRows.length
          toast.loading(
            t('export_progress', { fetched, total }),
            { id: progressToast }
          )
        }
        toast.dismiss(progressToast)
      }

      // 表头
      const headers = [
        t('table.user'),
        'Email',
        t('table.inactive_days'),
        t('table.bucket'),
        t('table.subscription'),
        t('table.points'),
        t('table.lang'),
        t('table.last_active'),
        t('table.created'),
      ]

      // 数据行
      const lines = allRows.map((row) => [
        row.name || '',
        row.email,
        row.inactiveDays,
        row.bucket,
        row.subscriptionStatus || '',
        row.subscriptionPlan || '',
        row.points ?? '',
        row.preferredLanguage || '',
        row.updatedAt || '',
        row.createdAt || '',
      ])

      const csv = buildCsv(headers, lines)
      const filename = buildExportFilename('dormant_users_export')
      downloadCsv(filename, csv)
      toast.success(t('exported', { count: allRows.length }))
    } catch (err) {
      console.error(err)
      toast.dismiss(progressToast)
      toast.error(t('error.export_failed'))
    } finally {
      setExporting(false)
    }
  }

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t('copied', { value: label }))
    } catch {
      toast.error(t('error.copy_failed'))
    }
  }

  // 点击"沉睡+曾付费"卡片 → 设置筛选
  // 同时重置 bucket / 搜索 / 语言 / 排序,避免与"分桶卡片点击"行为不一致
  //(都是为了切换到新筛选视图,不要带上前一个查询的搜索条件)
  const onClickDormantPaid = () => {
    setPage(1)
    setBucket('')
    setSubscription('paid_history')
    setSearch('')
    setSearchInput('')
    setLang('')
    setSort('inactive_desc')
    toast.info(t('filter_applied'))
  }

  // 通用:点击 bucket 卡片 → 切换到该桶筛选
  // 切换桶时重置所有上下文筛选条件,避免上一次桶的查询残留
  // 干扰新桶的展示(典型场景:用户先在 active 桶搜了 "xxx@email.com",
  // 再切换到 warm 桶时如果保留搜索,会看不到 warm 桶的真实数据)
  const onClickBucket = (bucketValue: string) => {
    setPage(1)
    setBucket(bucketValue)
    setSearch('')
    setSearchInput('')
    setLang('')
    setSubscription('')
    setSort('inactive_desc')
    toast.info(t('filter_applied'))
  }

  const pagination = data?.pagination
  const stats = data?.stats

  return (
    <div className="space-y-4">
      {/* 顶部统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard
          title={t('stats.total_users')}
          value={stats?.totalUsers}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title={t('stats.inactive_signups')}
          value={stats?.inactiveSignups}
          hint={t('stats.inactive_signups_hint')}
          icon={<UserPlus className="h-4 w-4 text-muted-foreground" />}
          valueClassName="text-sky-600 dark:text-sky-400"
          onClick={() => setActiveSubscribersOpen(true)}
          clickHint={t('click_to_view')}
        />
        <StatCard
          title={t('stats.active')}
          value={stats?.active}
          hint={t('stats.active_hint')}
          valueClassName="text-emerald-600 dark:text-emerald-400"
          onClick={() => onClickBucket('active')}
          clickHint={t('click_to_filter')}
        />
        <StatCard
          title={t('stats.warm')}
          value={stats?.warm}
          hint={t('stats.warm_hint')}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          onClick={() => onClickBucket('warm')}
          clickHint={t('click_to_filter')}
        />
        <StatCard
          title={t('stats.dormant')}
          value={stats?.dormant}
          valueClassName="text-amber-600 dark:text-amber-400"
          onClick={() => onClickBucket('dormant')}
          clickHint={t('click_to_filter')}
        />
        <StatCard
          title={t('stats.inactive')}
          value={stats?.inactive}
          icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
          valueClassName="text-orange-600 dark:text-orange-400"
          onClick={() => onClickBucket('inactive')}
          clickHint={t('click_to_filter')}
        />
        <StatCard
          title={t('stats.churned')}
          value={stats?.churned}
          icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
          valueClassName="text-red-700 dark:text-red-500"
          onClick={() => onClickBucket('churned')}
          clickHint={t('click_to_filter')}
        />
        <StatCard
          title={t('stats.dormant_paid')}
          value={stats?.dormantPaidHistory}
          hint={t('stats.dormant_paid_hint')}
          valueClassName="text-rose-600 dark:text-rose-400"
          onClick={onClickDormantPaid}
          clickHint={t('click_to_filter')}
        />
      </div>

      {/* 筛选 + 搜索 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-2">
              <Input
                placeholder={t('search_placeholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSearch()
                }}
                className="w-[220px]"
              />
              <Button onClick={onSearch} size="sm">
                {t('search_button')}
              </Button>
            </div>

            <Select
              value={bucket || 'all'}
              onValueChange={(v) => {
                setPage(1)
                setBucket(v === 'all' ? '' : v)
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('filter.bucket')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter.all_buckets')}</SelectItem>
                <SelectItem value="warm">{t('filter.bucket_warm')}</SelectItem>
                <SelectItem value="dormant">{t('filter.bucket_dormant')}</SelectItem>
                <SelectItem value="inactive">{t('filter.bucket_inactive')}</SelectItem>
                <SelectItem value="churned">{t('filter.bucket_churned')}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={subscription || 'all'}
              onValueChange={(v) => {
                setPage(1)
                setSubscription(v === 'all' ? '' : v)
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('filter.subscription')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter.all_subscriptions')}</SelectItem>
                <SelectItem value="active">{t('filter.sub_active')}</SelectItem>
                <SelectItem value="paid_history">{t('filter.sub_history')}</SelectItem>
                <SelectItem value="never_paid">{t('filter.sub_never')}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={lang || 'all'}
              onValueChange={(v) => {
                setPage(1)
                setLang(v === 'all' ? '' : v)
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t('filter.language')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter.all_languages')}</SelectItem>
                <SelectItem value="zh">{t('filter.lang_zh')}</SelectItem>
                <SelectItem value="en">{t('filter.lang_en')}</SelectItem>
                <SelectItem value="ja">{t('filter.lang_ja')}</SelectItem>
                <SelectItem value="ko">{t('filter.lang_ko')}</SelectItem>
                <SelectItem value="tw">{t('filter.lang_tw')}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sort}
              onValueChange={(v) => {
                setPage(1)
                setSort(v)
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('filter.sort')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inactive_desc">{t('filter.sort_inactive_desc')}</SelectItem>
                <SelectItem value="inactive_asc">{t('filter.sort_inactive_asc')}</SelectItem>
                <SelectItem value="points_desc">{t('filter.sort_points_desc')}</SelectItem>
                <SelectItem value="created_desc">{t('filter.sort_created_desc')}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={String(limit)}
              onValueChange={(v) => {
                setPage(1)
                setLimit(parseInt(v, 10))
              }}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">{t('filter.page_size_10')}</SelectItem>
                <SelectItem value="20">{t('filter.page_size_20')}</SelectItem>
                <SelectItem value="50">{t('filter.page_size_50')}</SelectItem>
                <SelectItem value="100">{t('filter.page_size_100')}</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" size="sm" onClick={onReset}>
              {t('reset')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onExportCsv}
              disabled={exporting || loading}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="ml-1">{t('export_csv')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 主列表 */}
      <Card>
        <CardContent className="p-0">
          {loading && !data ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <DormantUsersTable
                rows={data?.rows || []}
                t={t}
                dateLocale={dateLocale}
                onCopy={copyText}
                emptyText={t('no_data')}
                showInactiveDays={true}
              />

              {/* 分页 */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t p-3 text-sm">
                  <div className="text-muted-foreground">
                    {t('pagination.summary', {
                      from: (pagination.page - 1) * pagination.limit + 1,
                      to: Math.min(pagination.page * pagination.limit, pagination.total),
                      total: pagination.total,
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, pagination.page - 1))}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t('pagination.prev')}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage(Math.min(pagination.totalPages, pagination.page + 1))
                      }
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      {t('pagination.next')}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 未激活账号 Dialog */}
      <InactiveSignupsDialog
        open={inactiveSignupsOpen}
        onOpenChange={setActiveSubscribersOpen}
        t={t}
        locale={locale}
      />
    </div>
  )
}