'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Github, Mail } from 'lucide-react'
import { SiGoogle, SiGithub } from 'react-icons/si'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'

interface ConnectedAccount {
  provider: string
  connected: boolean
}

export function ConnectedAccounts() {
  const t = useTranslations('profile')
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)

  useEffect(() => {
    fetchConnectedAccounts()
  }, [])

  const fetchConnectedAccounts = async () => {
    try {
      const response = await fetch('/api/user/connected-accounts')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts)
      }
    } catch (error) {
      console.error('获取关联账户失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (provider: string) => {
    setConnecting(provider)
    try {
      await signIn(provider, { callbackUrl: '/profile' })
    } catch (error) {
      console.error('连接失败:', error)
      toast.error(t('account_connection_failed'))
    } finally {
      setConnecting(null)
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'github':
        return <SiGithub className="h-5 w-5" />
      case 'google':
        return <SiGoogle className="h-5 w-5" />
      default:
        return <Mail className="h-5 w-5" />
    }
  }

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'github':
        return t('github_account')
      case 'google':
        return t('google_account')
      default:
        return provider
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'github':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'google':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-secondary/80 backdrop-blur-sm cyber-glow-subtle">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-foreground">
            <Github className="h-5 w-5 text-primary" />
            <span>{t('connected_accounts')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">{t('loading')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-secondary/80 backdrop-blur-sm cyber-glow-subtle">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-foreground">
          <Github className="h-5 w-5 text-primary" />
          <span>{t('connected_accounts')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account.provider}
              className="flex items-center justify-between p-4 bg-secondary/50 border border-primary/30 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {getProviderIcon(account.provider)}
                <div>
                  <h3 className="font-medium text-foreground">
                    {getProviderName(account.provider)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {account.connected ? t('connected') : t('not_connected')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  variant={account.connected ? 'default' : 'secondary'}
                  className={`${account.connected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'} border`}
                >
                  {account.connected ? t('connected') : t('not_connected')}
                </Badge>
                {!account.connected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnect(account.provider)}
                    disabled={connecting === account.provider}
                    className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    {connecting === account.provider ? t('connecting') : t('connect')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 