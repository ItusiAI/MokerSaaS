"use client"

import { useEffect, useMemo, useState } from 'react'
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
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Mail,
  Copy,
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN, enUS, ja as jaLocale, ko as koLocale } from 'date-fns/locale'
import type { Locale as DateFnsLocale } from 'date-fns/locale'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'

const APP_DATE_FNS_LOCALE: Record<string, DateFnsLocale> = {
  'zh-CN': zhCN,
  'zh-TW': zhCN,
  ja: jaLocale,
  ko: koLocale,
}
function getDateFnsLocale(locale: string | undefined | null): DateFnsLocale {
  return APP_DATE_FNS_LOCALE[locale || ''] || enUS
}

interface ReminderRow {
  id: string
  userId: string
  userEmail: string | null
  userName: string | null
  reminderType: '7d' | '3d' | 'today'
  sentAt: string
  periodEnd: string
  subject: string | null
  locale: string | null
  plan: string | null
  emailMessageId: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface RemindersResponse {
  rows: ReminderRow[]
  pagination: Pagination
  stats: { total: number; '7d': number; '3d': number; today: number }
}

const REMINDER_TYPE_BADGE: Record<'7d' | '3d' | 'today', 'default' | 'secondary' | 'outline' | 'destructive'> = {
  '7d': 'secondary',
  '3d': 'outline',
  today: 'destructive',
}

const LOCALE_LABEL_KEY: Record<string, string> = {
  'zh-CN': 'chinese',
  en: 'english',
  ja: 'japanese',
  ko: 'korean',
  'zh-TW': 'traditionalChinese',
}

function languageLabel(locale: string, t: ReturnType<typeof useTranslations<string>>): string {
  const key = LOCALE_LABEL_KEY[locale]
  if (!key) return locale.toUpperCase()
  // 取 newsletter table 里的同名键,保持一致; 用 t.has() 避免 next-intl 在 dev 下抛 MISSING_MESSAGE
  try {
    return t.has(`lang.${key}` as any) ? t(`lang.${key}` as any) : locale.toUpperCase()
  } catch {
    return locale.toUpperCase()
  }
}

export function ReminderLogs() {
  const t = useTranslations('admin.reminders')
  const locale = useLocale()

  const [data, setData] = useState<RemindersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [reminderType, setReminderType] = useState<string>('')
  const [lang, setLang] = useState<string>('')

  const dateLocale = getDateFnsLocale(locale)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (search) params.set('search', search)
      if (reminderType) params.set('reminderType', reminderType)
      if (lang) params.set('locale', lang)

      const res = await fetch(`/api/admin/reminders?${params.toString()}`)
      if (!res.ok) throw new Error('fetch_failed')
      const json: RemindersResponse = await res.json()
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
  }, [page, limit, search, reminderType, lang])

  const onSearch = () => {
    setPage(1)
    setSearch(searchInput.trim())
  }
  const onReset = () => {
    setPage(1)
    setSearchInput('')
    setSearch('')
    setReminderType('')
    setLang('')
    setLimit(10)
  }

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t('copied', { value: label }))
    } catch {
      toast.error(t('error.copy_failed'))
    }
  }

  const pagination = data?.pagination

  const formatDateTime = (iso: string) => {
    try {
      return format(new Date(iso), 'yyyy-MM-dd HH:mm:ss')
    } catch {
      return iso
    }
  }
  const formatDateOnly = (iso: string) => {
    try {
      return format(new Date(iso), 'yyyy-MM-dd')
    } catch {
      return iso
    }
  }

  const typeBadgeVariant = (type: ReminderRow['reminderType']) =>
    REMINDER_TYPE_BADGE[type] ?? 'default'

  return (
    <div className="space-y-4">
      {/* 顶部统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">{t('stats.total')}</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">{t('stats.7d')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats['7d'] ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">{t('stats.3d')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats['3d'] ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">{t('stats.today')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats.today ?? 0}</div>
          </CardContent>
        </Card>
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
              value={reminderType || 'all'}
              onValueChange={(v) => {
                setPage(1)
                setReminderType(v === 'all' ? '' : v)
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t('filter.type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter.all_types')}</SelectItem>
                <SelectItem value="7d">{t('filter.type_7d')}</SelectItem>
                <SelectItem value="3d">{t('filter.type_3d')}</SelectItem>
                <SelectItem value="today">{t('filter.type_today')}</SelectItem>
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
                <SelectItem value="zh-CN">{t('filter.lang_zh')}</SelectItem>
                <SelectItem value="en">{t('filter.lang_en')}</SelectItem>
                <SelectItem value="ja">{t('filter.lang_ja')}</SelectItem>
                <SelectItem value="ko">{t('filter.lang_ko')}</SelectItem>
                <SelectItem value="zh-TW">{t('filter.lang_tw')}</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      {/* 列表 */}
      <Card>
        <CardContent className="p-0">
          {loading && !data ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">{t('table.sent_at')}</TableHead>
                      <TableHead className="w-[90px]">{t('table.type')}</TableHead>
                      <TableHead>{t('table.user')}</TableHead>
                      <TableHead className="w-[80px]">{t('table.lang')}</TableHead>
                      <TableHead className="w-[110px]">{t('table.period_end')}</TableHead>
                      <TableHead>{t('table.subject')}</TableHead>
                      <TableHead className="w-[120px]">{t('table.message_id')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.rows.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-sm text-muted-foreground py-8"
                        >
                          {t('no_data')}
                        </TableCell>
                      </TableRow>
                    )}
                    {data?.rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDateTime(row.sentAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={typeBadgeVariant(row.reminderType)}>
                            {t(`type.${row.reminderType}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {row.userName || row.userEmail || row.userId.slice(0, 8)}
                            </span>
                            {row.userEmail && (
                              <button
                                type="button"
                                onClick={() => copyText(row.userEmail!, t('labels.email'))}
                                className="text-xs text-muted-foreground hover:text-primary text-left"
                              >
                                {row.userEmail}
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {row.locale ? (
                            <Badge variant="outline">
                              {languageLabel(row.locale, t as any)}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDateOnly(row.periodEnd)}
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <div className="flex items-center gap-1">
                            <span className="text-sm truncate" title={row.subject ?? ''}>
                              {row.subject ?? <span className="text-muted-foreground">—</span>}
                            </span>
                            {row.subject && (
                              <button
                                type="button"
                                onClick={() => copyText(row.subject!, t('labels.subject'))}
                                className="text-muted-foreground hover:text-primary"
                                aria-label="copy"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {row.emailMessageId ? (
                            <code
                              className="text-[11px] cursor-pointer hover:text-primary"
                              onClick={() => copyText(row.emailMessageId!, t('labels.message_id'))}
                              title={row.emailMessageId}
                            >
                              {row.emailMessageId.length > 14
                                ? `${row.emailMessageId.slice(0, 12)}…`
                                : row.emailMessageId}
                            </code>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

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
    </div>
  )
}