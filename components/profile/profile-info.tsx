"use client"

import { useSession } from 'next-auth/react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  User,
  Mail,
  Calendar,
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  Coins,
  TrendingUp,
  TrendingDown,
  Gift,
  UserPlus,
  Award,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  CreditCard,
  History,
  Link,
  Activity,
  Music,
  Image,
  Bot,
  Video,
  FileText,
  Box
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { ConnectedAccounts } from './connected-accounts'
import { SubscriptionInfo } from './subscription-info'
import { PointsPurchase } from './points-purchase'
import { PaymentHistory } from './payment-history'
import { toast } from 'sonner'
// table UI not added — keep original list layout for points history

interface PointsHistoryItem {
  id: string
  points: number
  action: string
  description: string
  createdAt: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface UserDetails {
  id: string
  name: string | null
  email: string
  image: string | null
  emailVerified: Date | null
  createdAt: Date
  role: string
}

// 定义有效的区域 ID 列表
const VALID_SECTIONS = ['points-purchase', 'subscription', 'points-history', 'payment-history', 'connected-accounts', 'account-status'] as const
type SectionId = typeof VALID_SECTIONS[number]

function ProfileInfoContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("profile")
  const tPlan = useTranslations("profile") // 复用 Profile 命名空间中的订阅计划翻译
  const { data: session, status } = useSession()
  
  // 积分相关状态
  const [points, setPoints] = useState<number | null>(null)
  const [pointsLoading, setPointsLoading] = useState(false)
  const [history, setHistory] = useState<PointsHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  
  // 用户详情状态
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [userDetailsLoading, setUserDetailsLoading] = useState(false)
  
  // 重发验证邮件状态
  const [resendingEmail, setResendingEmail] = useState(false)
  
  // 从 URL 参数获取当前选中的分类，默认为 subscription
  const activeSectionFromUrl = searchParams.get('tab') as SectionId | null
  const [activeSection, setActiveSection] = useState<SectionId>(activeSectionFromUrl && VALID_SECTIONS.includes(activeSectionFromUrl) ? activeSectionFromUrl : 'subscription')

  // 更新 URL 参数
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId as SectionId)
    // 更新 URL 参数，不刷新页面
    const url = new URL(window.location.href)
    url.searchParams.set('tab', sectionId)
    window.history.pushState({}, '', url.toString())
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 分类配置 - 积分购买放在订阅信息上面
  const sections = [
    { id: 'points-purchase', label: t('points_purchase'), icon: Coins },
    { id: 'subscription', label: t('subscription_info'), icon: CreditCard },
    { id: 'points-history', label: t('points_history'), icon: History },
    { id: 'payment-history', label: t('payment_history'), icon: History },
    { id: 'connected-accounts', label: t('connected_accounts'), icon: Link },
    { id: 'account-status', label: t('account_status'), icon: Activity }
  ]

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchPoints()
      fetchHistory(currentPage)
      fetchUserDetails()
    }
  }, [status, session, currentPage])

  // 处理支付状态
  useEffect(() => {
    const payment = searchParams.get('payment')
    const sessionId = searchParams.get('session_id')
    
    if (payment === 'success') {
      toast.success('积分购买成功！积分已添加到您的账户')
      // 刷新积分和历史记录
      fetchPoints()
      fetchHistory(currentPage)
      // 清除URL参数
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('payment')
        url.searchParams.delete('session_id')
        window.history.replaceState({}, '', url.toString())
      }
    } else if (payment === 'cancelled') {
      toast.error('支付已取消')
      // 清除URL参数
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('payment')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [searchParams, currentPage])

  const fetchUserDetails = async () => {
    setUserDetailsLoading(true)
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserDetails(data.user)
      }
    } catch (error) {
      console.error('获取用户详情失败:', error)
    } finally {
      setUserDetailsLoading(false)
    }
  }

  const fetchPoints = async () => {
    setPointsLoading(true)
    try {
      const response = await fetch('/api/points')
      if (response.ok) {
        const data = await response.json()
        setPoints(data.points)
      }
    } catch (error) {
      console.error('获取积分失败:', error)
    } finally {
      setPointsLoading(false)
    }
  }

  const fetchHistory = async (page: number = 1) => {
    setHistoryLoading(true)
    try {
      const response = await fetch(`/api/points/history?page=${page}&limit=5`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('获取积分历史失败:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleResendVerification = async () => {
    setResendingEmail(true)
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || t('verification_email_sent'))
      } else {
        toast.error(data.error || t('verification_email_failed'))
      }
    } catch (error) {
      console.error('重发验证邮件失败:', error)
      toast.error(t('verification_email_failed'))
    } finally {
      setResendingEmail(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'register':
        return <Gift className="h-4 w-4" />
      case 'email_verify':
        return <Mail className="h-4 w-4" />
      case 'daily_login':
        return <Calendar className="h-4 w-4" />
      case 'referral':
        return <UserPlus className="h-4 w-4" />
      case 'manual':
        return <Award className="h-4 w-4" />
      case 'purchase':
        return <Coins className="h-4 w-4" />
      case 'subscription_gift':
        return <Gift className="h-4 w-4" />
      case 'subscription_expired':
        return <X className="h-4 w-4" />
      case 'ai_tts':
        return <Activity className="h-4 w-4" />
      case 'ai_stt':
        return <Activity className="h-4 w-4" />
      case 'ai_music':
        return <Music className="h-4 w-4" />
      case 'ai_image':
        return <Image className="h-4 w-4" />
      case 'ai_chat':
        return <Bot className="h-4 w-4" />
      case 'ai_video':
        return <Video className="h-4 w-4" />
      case 'ai_ocr':
        return <FileText className="h-4 w-4" />
      case 'ai_lipsync':
        return <Video className="h-4 w-4" />
      case 'ai_3d':
        return <Box className="h-4 w-4" />
      case 'ai_image_3d':
        return <Box className="h-4 w-4" />
      default:
        return <Coins className="h-4 w-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'register':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'email_verify':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'daily_login':
        return 'bg-coral-100 text-coral-800 border-coral-200'
      case 'referral':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'manual':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'purchase':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'subscription_gift':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'subscription_expired':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getActionDescription = (action: string, description?: string) => {
    // 从描述中提取订阅计划名称
    const extractPlanName = (desc: string): string | null => {
      // 匹配模式：订阅{计划}赠送积分 或 续订{计划}赠送积分 或 升级{计划}赠送积分
      const patterns = [
        /(?:订阅|续订|升级)([A-Za-z]+)\s*赠送积分/,
        /(?:订阅|续订|升级)([A-Za-z]+)赠送积分/,
      ]
      
      for (const pattern of patterns) {
        const match = desc.match(pattern)
        if (match && match[1]) {
          return match[1]
        }
      }
      return null
    }

    // 获取订阅计划显示名称（从翻译文件获取，如果不存在则格式化原始值）
    const getPlanDisplayName = (plan: string): string => {
      if (!plan) return ''
      const planKey = `plan_${plan.toLowerCase()}`
      try {
        const planName = tPlan(planKey)
        // 如果翻译不存在，返回原始值（首字母大写）
        return planName || plan.charAt(0).toUpperCase() + plan.slice(1)
      } catch {
        // 如果翻译键不存在，返回格式化的原始值
        return plan.charAt(0).toUpperCase() + plan.slice(1)
      }
    }

    switch (action) {
      case 'register':
        return t('points_actions.register')
      case 'email_verify':
        return t('points_actions.email_verify')
      case 'daily_login':
        return t('points_actions.daily_login')
      case 'referral':
        return t('points_actions.referral')
      case 'manual':
        return t('points_actions.manual')
      case 'purchase':
        return t('points_actions.purchase')
      case 'subscription_gift':
        // 从描述中提取订阅计划名称
        if (description) {
          const planName = extractPlanName(description)
          if (planName) {
            const planKey = planName.toLowerCase()
            const planDisplayName = getPlanDisplayName(planKey)
            return t('points_actions.subscription_gift', { plan: planDisplayName })
          }
        }
        // 如果无法从描述中提取，使用默认翻译
        return t('points_actions.subscription_gift', { plan: '' })
      case 'subscription_renewal_gift':
        // 从描述中提取订阅计划名称
        if (description) {
          const planName = extractPlanName(description)
          if (planName) {
            const planKey = planName.toLowerCase()
            const planDisplayName = getPlanDisplayName(planKey)
            return t('points_actions.subscription_renewal_gift', { plan: planDisplayName })
          }
        }
        // 如果无法从描述中提取，使用默认翻译
        return t('points_actions.subscription_renewal_gift', { plan: '订阅' })
      case 'subscription_upgrade_gift':
        // 从描述中提取订阅计划名称
        if (description) {
          const planName = extractPlanName(description)
          if (planName) {
            const planKey = planName.toLowerCase()
            const planDisplayName = getPlanDisplayName(planKey)
            return t('points_actions.subscription_upgrade_gift', { plan: planDisplayName })
          }
        }
        // 如果无法从描述中提取，使用默认翻译
        return t('points_actions.subscription_upgrade_gift', { plan: '' })
      case 'subscription_reward':
        return t('points_actions.subscription_reward')
      case 'subscription_expired':
        return t('points_actions.subscription_expired')
      case 'ai_image':
        // AI 图片生成根据当前 locale 使用翻译，而不是直接使用数据库中的 description
        // 因为 description 可能存储的是操作时的语言，而不是当前界面语言
        return t('points_actions.ai_image')
      case 'ai_tts':
        return t('points_actions.ai_tts')
      case 'ai_chat':
        // AI 对话根据当前 locale 使用翻译，而不是直接使用数据库中的 description
        return t('points_actions.ai_chat')
      case 'ai_video':
        // AI 视频生成同样根据当前 locale 使用翻译
        return t('points_actions.ai_video')
      case 'ai_stt':
        return t('points_actions.ai_stt')
      case 'ai_music':
        // AI 音乐生成根据当前 locale 使用翻译
        return t('points_actions.ai_music')
      case 'ai_ocr':
        return t('points_actions.ai_ocr')
      default:
        return description || t('points_actions.unknown')
    }
  }

  const formatDetailedTime = (dateString: string) => {
    const date = new Date(dateString)
    if (locale === 'zh') {
      return format(date, 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
    }
    return format(date, 'MMM dd, yyyy HH:mm', { locale: enUS })
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'subscription':
        return <SubscriptionInfo />
      
      case 'points-purchase':
        return <PointsPurchase onPointsUpdate={fetchPoints} />
      
      case 'points-history':
        return (
          <Card className="shadow-lg border-0 bg-secondary/80 backdrop-blur-sm cyber-glow-subtle">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-foreground">
                <Coins className="h-5 w-5 text-primary" />
                <span>{t('points_history')}</span>
              </CardTitle>
              <CardDescription>
                {t('points_history_description')}
                {pagination && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    （{t('pagination.total_records', { total: pagination.totalItems })}）
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8">
                  <Coins className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t('no_points_history')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border border-dark-600/50 rounded-lg hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/20 border border-primary/50">
                          {getActionIcon(item.action)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {getActionDescription(item.action, item.description)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDetailedTime(item.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={item.points > 0 ? 'default' : 'secondary'}
                          className={`flex items-center gap-1 ${
                            item.points > 0 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}
                        >
                          {item.points > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {item.points > 0 ? '+' : ''}{item.points}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {/* 分页控件 */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-charcoal-600">
                        {t('pagination.page_info', { current: pagination.currentPage, total: pagination.totalPages })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={!pagination.hasPreviousPage}
                          className="h-8 px-3"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          {t('pagination.previous')}
                        </Button>
                        
                        {/* 页码显示 */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            let pageNum;
                            const totalPages = pagination.totalPages;
                            const currentPage = pagination.currentPage;
                            
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={pageNum === currentPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                className="h-8 w-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={!pagination.hasNextPage}
                          className="h-8 px-3"
                        >
                          {t('pagination.next')}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      
      case 'connected-accounts':
        return <ConnectedAccounts />
      
      case 'account-status':
        return (
          <Card className="shadow-lg border-0 bg-secondary/80 backdrop-blur-sm cyber-glow-subtle">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-foreground">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>{t('account_status')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-primary/20 border border-primary/50 rounded-lg cyber-glow-subtle">
                  <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-primary font-medium">
                    {t('email_verified')}
                  </p>
                </div>
                <div className="text-center p-4 bg-secondary/70 border border-primary/40 rounded-lg">
                  <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-primary/80 font-medium">
                    {t('account_secure')}
                  </p>
                </div>
                <div className="text-center p-4 bg-secondary/70 border border-primary/40 rounded-lg">
                  <User className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-primary/80 font-medium">
                    {t('profile_complete')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      
      case 'payment-history':
        return <PaymentHistory />
      
      default:
        return <SubscriptionInfo />
    }
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Alert>
          <AlertDescription>
            {t('please_login')}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          {t('title')}
        </h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* 主要布局：左边栏 + 右侧内容 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧边栏 */}
        <div className="lg:col-span-1">
          {/* 个人信息框 */}
          <Card className="shadow-xl border-0 bg-secondary/80 backdrop-blur-sm mb-6 cyber-glow-subtle">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-16 w-16 ring-3 ring-cyber-500/50 mb-3">
                  <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                  <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                    {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-bold text-foreground mb-1">
                  {session.user.name || t('no_name_set')}
                </h2>
                <p className="text-sm text-muted-foreground mb-3 break-all">{session.user.email}</p>
                
                {/* 验证状态单独一行 */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  {userDetails?.emailVerified ? (
                    <div className="flex items-center gap-2 px-2 py-1 bg-primary/20 border border-primary/50 rounded-full">
                      <CheckCircle className="h-3 w-3 text-primary" />
                      <span className="text-primary text-xs font-medium">
                        {t('verified')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-full">
                        <XCircle className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                        <span className="text-orange-600 dark:text-orange-400 text-xs font-medium">
                          {t('unverified')}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleResendVerification}
                        disabled={resendingEmail}
                        className="h-6 px-2 text-xs border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                      >
                        {resendingEmail ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            {t('sending')}
                          </>
                        ) : (
                          <>
                            <Mail className="h-3 w-3 mr-1" />
                            {t('resend_verification')}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* 积分数值单独一行 */}
                <div className="w-full text-center mb-3">
                  <div className="px-4 py-2 bg-secondary/50 border border-primary/30 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Coins className="h-4 w-4 text-yellow-600" />
                      <span className="text-xs text-yellow-600 font-medium">{t('points')}</span>
                    </div>
                    {pointsLoading ? (
                      <div className="text-yellow-600 text-sm">{t('loading')}</div>
                    ) : (
                      <div className="text-yellow-800 font-bold text-lg">
                        {points?.toLocaleString() || 0}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 分类导航 */}
          <Card className="shadow-lg border-0 bg-secondary/80 backdrop-blur-sm cyber-glow-subtle">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-foreground text-base">
                <Settings className="h-4 w-4 text-primary" />
                <span>{t('menu')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleSectionChange(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50 ${
                        activeSection === section.id
                          ? 'bg-primary/20 text-primary border-r-2 border-primary'
                          : 'text-muted-foreground hover:text-primary'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{section.label}</span>
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* 右侧内容区域 */}
        <div className="lg:col-span-3">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

// 包装组件以支持 Suspense（useSearchParams 需要）
export function ProfileInfo() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <ProfileInfoContent />
    </Suspense>
  )
}