"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Send,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN, enUS, ja as jaLocale, ko as koLocale } from 'date-fns/locale'
import type { Locale as DateFnsLocale } from 'date-fns/locale'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import { Logs } from 'lucide-react'
import { LogsCampaign } from './reengagement-logs-campaign'

const APP_DATE_FNS_LOCALE: Record<string, DateFnsLocale> = {
  zh: zhCN,
  ja: jaLocale,
  ko: koLocale,
}
function getDateFnsLocale(locale: string | undefined | null): DateFnsLocale {
  return APP_DATE_FNS_LOCALE[locale || ''] || enUS
}

type CampaignBucket = 'warm' | 'dormant' | 'inactive' | 'churned' | 'sleeping_paid'
type CampaignStatus = 'draft' | 'ready' | 'sending' | 'completed' | 'cancelled'

interface LocaleContent {
  subject: string
  heading: string
  body: string
  cta: string
  footer: string
}

interface CampaignRow {
  id: string
  name: string
  bucket: CampaignBucket
  content: Record<string, LocaleContent> | null
  targetCount: number
  sentCount: number
  failedCount: number
  status: CampaignStatus
  scheduledAt: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface CampaignsResponse {
  campaigns: CampaignRow[]
  pagination: Pagination
}

const BUCKET_BADGE: Record<CampaignBucket, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  warm: 'secondary',
  dormant: 'outline',
  inactive: 'secondary',
  churned: 'destructive',
  sleeping_paid: 'default',
}

const STATUS_BADGE: Record<CampaignStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline',
  ready: 'secondary',
  sending: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
}

export function ReengagementCampaigns() {
  const t = useTranslations('admin.reengagement.campaigns')
  const currentLocale = useLocale()

  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBucket, setFilterBucket] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formBucket, setFormBucket] = useState<CampaignBucket>('warm')
  const [creating, setCreating] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [sendOpen, setSendOpen] = useState(false)
  const [sendCampaignId, setSendCampaignId] = useState<string | null>(null)
  const [sendMode, setSendMode] = useState<'bucket' | 'specific'>('bucket')
  const [selectedUsers, setSelectedUsers] = useState<{ id: string; email: string; name: string | null }[]>([])
  const [bucketCount, setBucketCount] = useState(0)
  const [userFilter, setUserFilter] = useState('')
  const [bucketUsers, setBucketUsers] = useState<{ id: string; email: string; name: string | null }[]>([])
  const [bucketUsersLoading, setBucketUsersLoading] = useState(false)
  const [logsOpen, setLogsOpen] = useState(false)
  const [logsCampaignId, setLogsCampaignId] = useState<string | null>(null)
  const filteredBucketUsers = userFilter
    ? bucketUsers.filter(
        (u) =>
          u.email.toLowerCase().includes(userFilter.toLowerCase()) ||
          (u.name && u.name.toLowerCase().includes(userFilter.toLowerCase())),
      )
    : bucketUsers

  const dfnsLocale = getDateFnsLocale(currentLocale)

  const fetchCampaigns = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (filterStatus) params.set('status', filterStatus)
      if (filterBucket) params.set('bucket', filterBucket)
      const res = await fetch(`/api/admin/reengagement/campaigns?${params}`)
      if (!res.ok) throw new Error()
      const data: CampaignsResponse = await res.json()
      setCampaigns(data.campaigns)
      setPagination(data.pagination)
    } catch {
      toast.error(t('error.fetch_failed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [filterStatus, filterBucket])

  const handleCreate = async () => {
    if (!formName) {
      toast.error(t('error.fill_required'))
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/reengagement/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          bucket: formBucket,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(t('success.created'))
      setCreateOpen(false)
      setFormName('')
      setFormBucket('warm')
      fetchCampaigns()
    } catch {
      toast.error(t('error.create_failed'))
    } finally {
      setCreating(false)
    }
  }

  const openSendDialog = async (id: string) => {
    setSendCampaignId(id)
    setSendMode('bucket')
    setSelectedUsers([])
    setUserFilter('')
    setBucketUsers([])
    setSendOpen(true)
    const res = await fetch(`/api/admin/reengagement/campaigns/${id}/count`)
    if (res.ok) {
      const data = await res.json()
      setBucketCount(data.count)
    } else {
      setBucketCount(0)
    }
  }

  const openLogsDialog = (id: string) => {
    setLogsCampaignId(id)
    setLogsOpen(true)
  }

  const loadBucketUsers = async () => {
    if (!sendCampaignId) return
    setBucketUsersLoading(true)
    try {
      const res = await fetch(`/api/admin/reengagement/campaigns/${sendCampaignId}/bucket-users`)
      if (!res.ok) return
      const data = await res.json()
      setBucketUsers(data.users)
    } finally {
      setBucketUsersLoading(false)
    }
  }

  const handleSend = async () => {
    if (!sendCampaignId) return
    if (sendMode === 'specific' && selectedUsers.length === 0) {
      toast.error(t('error.select_users'))
      return
    }
    if (!confirm(t('confirm.send'))) return
    setSendingId(sendCampaignId)
    setSendOpen(false)
    try {
      const body: { targetUserIds?: string[] } = {}
      if (sendMode === 'specific') {
        body.targetUserIds = selectedUsers.map((u) => u.id)
      }
      const res = await fetch(`/api/admin/reengagement/campaigns/${sendCampaignId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'send_failed')
      }
      const data = await res.json()
      if (data.summary) {
        toast.success(t('success.sent', { sent: data.summary.sentCount, total: data.summary.targetCount, failed: data.summary.failedCount }))
      } else {
        toast.success('发送完成')
      }
      fetchCampaigns()
    } catch (e: any) {
      toast.error(t('error.send_failed') + ': ' + (e.message || ''))
    } finally {
      setSendingId(null)
      setSendCampaignId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirm.delete'))) return
    try {
      const res = await fetch(`/api/admin/reengagement/campaigns/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(t('success.deleted'))
      fetchCampaigns()
    } catch {
      toast.error(t('error.delete_failed'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCampaigns()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Select value={filterStatus || '__all__'} onValueChange={(v) => setFilterStatus(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder={t('filter.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t('filter.all_status')}</SelectItem>
              <SelectItem value="draft">{t('status.draft')}</SelectItem>
              <SelectItem value="ready">{t('status.ready')}</SelectItem>
              <SelectItem value="sending">{t('status.sending')}</SelectItem>
              <SelectItem value="completed">{t('status.completed')}</SelectItem>
              <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterBucket || '__all__'} onValueChange={(v) => setFilterBucket(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t('filter.bucket')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t('filter.all_buckets')}</SelectItem>
              <SelectItem value="warm">{t('bucket.warm')}</SelectItem>
              <SelectItem value="dormant">{t('bucket.dormant')}</SelectItem>
              <SelectItem value="inactive">{t('bucket.inactive')}</SelectItem>
              <SelectItem value="churned">{t('bucket.churned')}</SelectItem>
              <SelectItem value="sleeping_paid">{t('bucket.sleeping_paid')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {t('actions.create')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.name')}</TableHead>
                <TableHead>{t('table.bucket')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead className="text-center">{t('table.sent')}</TableHead>
                <TableHead>{t('table.created')}</TableHead>
                <TableHead className="text-right">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t('table.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={BUCKET_BADGE[c.bucket]}>{t(`bucket.${c.bucket}`)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[c.status]}>
                        {t(`status.${c.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-green-600">{c.sentCount}</span>
                      {c.failedCount > 0 && (
                        <span className="text-red-500 ml-1">/ {c.failedCount}</span>
                      )}
                      {c.targetCount > 0 && (
                        <div className="text-xs text-muted-foreground">
                          / {c.targetCount}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(c.createdAt), 'yyyy-MM-dd', { locale: dfnsLocale })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {c.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openLogsDialog(c.id)}
                            title={t('actions.logs')}
                          >
                            <Logs className="h-4 w-4" />
                          </Button>
                        )}
                        {c.status !== 'sending' && c.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openSendDialog(c.id)}
                            disabled={sendingId === c.id}
                            title={t('actions.send')}
                          >
                            {sendingId === c.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {c.status !== 'sending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(c.id)}
                            title={t('actions.delete')}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
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
            onClick={() => fetchCampaigns(pagination.page - 1)}
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
            onClick={() => fetchCampaigns(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('create.title')}</DialogTitle>
            <DialogDescription>{t('create.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{t('form.name')} *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('form.name_placeholder')}
                className="mt-1"
              />
            </div>

            <div>
              <Label>{t('form.bucket')} *</Label>
              <Select value={formBucket} onValueChange={(v) => setFormBucket(v as CampaignBucket)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warm">{t('bucket.warm')}</SelectItem>
                  <SelectItem value="dormant">{t('bucket.dormant')}</SelectItem>
                  <SelectItem value="inactive">{t('bucket.inactive')}</SelectItem>
                  <SelectItem value="churned">{t('bucket.churned')}</SelectItem>
                  <SelectItem value="sleeping_paid">{t('bucket.sleeping_paid')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-muted-foreground">{t('form.template_note')}</p>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={creating || !formName}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              {t('actions.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('send.title')}</DialogTitle>
            <DialogDescription>{t('send.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="space-y-2">
              <div
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${sendMode === 'bucket' ? 'border-primary bg-primary/5' : 'border-border'}`}
                onClick={() => setSendMode('bucket')}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={sendMode === 'bucket'}
                    onChange={() => setSendMode('bucket')}
                    className="accent-primary"
                  />
                  <Label className="cursor-pointer">{t('send.mode_bucket')}</Label>
                  <Badge variant="secondary" className="ml-auto">{bucketCount}</Badge>
                </div>
                {sendMode === 'bucket' && (
                  <p className="text-sm text-muted-foreground mt-1 ml-6">
                    {t('send.bucket_count', { count: bucketCount })}
                  </p>
                )}
              </div>

              <div
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${sendMode === 'specific' ? 'border-primary bg-primary/5' : 'border-border'}`}
                onClick={() => {
                  setSendMode('specific')
                  if (bucketUsers.length === 0) loadBucketUsers()
                }}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={sendMode === 'specific'}
                    onChange={() => {
                      setSendMode('specific')
                      if (bucketUsers.length === 0) loadBucketUsers()
                    }}
                    className="accent-primary"
                  />
                  <Label className="cursor-pointer">{t('send.mode_specific')}</Label>
                  {sendMode === 'specific' && (
                    <Badge variant="outline" className="ml-auto">{selectedUsers.length}/{bucketUsers.length}</Badge>
                  )}
                </div>
              </div>
            </div>

            {sendMode === 'specific' && (
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <Label>{t('send.selected_users')}</Label>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUsers(bucketUsers)}
                      className="h-7 text-xs"
                    >
                      {t('send.select_all')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUsers([])}
                      className="h-7 text-xs"
                    >
                      {t('send.clear_all')}
                    </Button>
                  </div>
                </div>

                <Input
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  placeholder={t('send.search_placeholder')}
                  className="mb-2"
                />

                <div className="border rounded-md flex-1 overflow-y-auto">
                  {bucketUsersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredBucketUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{t('send.no_users')}</p>
                  ) : (
                    filteredBucketUsers.map((u) => (
                      <label
                        key={u.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 border-b last:border-b-0 cursor-pointer text-sm"
                      >
                        <Checkbox
                          checked={selectedUsers.some((s) => s.id === u.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedUsers([...selectedUsers, u])
                            else setSelectedUsers(selectedUsers.filter((s) => s.id !== u.id))
                          }}
                        />
                        <div className="min-w-0">
                          <div className="font-medium truncate">{u.email}</div>
                          {u.name && <div className="text-xs text-muted-foreground truncate">{u.name}</div>}
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={handleSend}
              disabled={
                sendingId !== null ||
                (sendMode === 'specific' && selectedUsers.length === 0)
              }
            >
              {sendingId ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {t('send.confirm')} {sendMode === 'specific' && `(${selectedUsers.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('logs.title')}</DialogTitle>
            <DialogDescription>{t('logs.description')}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <LogsCampaign campaignId={logsCampaignId} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogsOpen(false)}>
              {t('actions.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
