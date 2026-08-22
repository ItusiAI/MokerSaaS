"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
  Copy,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import { format } from 'date-fns'
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

interface LogRow {
  id: string
  campaignId: string
  userId: string
  email: string
  subject: string
  locale: string
  bucket: string
  status: 'pending' | 'sent' | 'failed' | 'bounced' | 'unsubscribed'
  messageId: string | null
  errorMessage: string | null
  sentAt: string | null
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface LogsResponse {
  logs: LogRow[]
  pagination: Pagination
}

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'outline',
  sent: 'secondary',
  failed: 'destructive',
  bounced: 'destructive',
  unsubscribed: 'secondary',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  sent: <CheckCircle className="h-3 w-3 text-green-500" />,
  failed: <XCircle className="h-3 w-3 text-red-500" />,
  bounced: <XCircle className="h-3 w-3 text-red-500" />,
  unsubscribed: <XCircle className="h-3 w-3 text-muted-foreground" />,
}

interface Props {
  campaignId: string | null
}

export function LogsCampaign({ campaignId }: Props) {
  const t = useTranslations('admin.reengagement.logs')
  const locale = useLocale()
  const dfnsLocale = getDateFnsLocale(locale)

  const [logs, setLogs] = useState<LogRow[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchLogs = async (page = 1) => {
    if (!campaignId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', campaignId })
      if (search) params.set('search', search)
      if (filterStatus) params.set('status', filterStatus)
      const res = await fetch(`/api/admin/reengagement/logs?${params}`)
      if (!res.ok) throw new Error()
      const data: LogsResponse = await res.json()
      setLogs(data.logs)
      setPagination(data.pagination)
    } catch {
      toast.error(t('error.fetch_failed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (campaignId) {
      fetchLogs()
    }
  }, [campaignId])

  useEffect(() => {
    if (campaignId) {
      fetchLogs(1)
    }
  }, [search, filterStatus])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success(t('copied'))
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchLogs(pagination.page)}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>

        <div className="flex-1 max-w-sm">
          <Input
            placeholder={t('search_placeholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPagination((p) => ({ ...p, page: 1 }))
            }}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs(1)}
          />
        </div>

        <Select value={filterStatus} onValueChange={(v) => {
          setFilterStatus(v === 'all' ? '' : v)
          setPagination((p) => ({ ...p, page: 1 }))
          fetchLogs(1)
        }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t('filter.type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filter.all_types')}</SelectItem>
            <SelectItem value="pending">{t('status.pending')}</SelectItem>
            <SelectItem value="sent">{t('status.sent')}</SelectItem>
            <SelectItem value="failed">{t('status.failed')}</SelectItem>
            <SelectItem value="bounced">{t('status.bounced')}</SelectItem>
            <SelectItem value="unsubscribed">{t('status.unsubscribed')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.email')}</TableHead>
                <TableHead>{t('table.bucket')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead>{t('table.sent_at')}</TableHead>
                <TableHead>{t('table.error')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t('no_data')}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="truncate max-w-[180px]">{log.email}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopy(log.email, log.id)}
                        >
                          {copiedId === log.id ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{t(`bucket.${log.bucket}`)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[log.status] || 'outline'} className="flex items-center gap-1 w-fit">
                        {STATUS_ICONS[log.status]}
                        {t(`status.${log.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.sentAt
                        ? format(new Date(log.sentAt), 'yyyy-MM-dd HH:mm', { locale: dfnsLocale })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-red-500 max-w-[150px] truncate">
                      {log.errorMessage || '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
