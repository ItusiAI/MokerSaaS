"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { loadStripe } from '@stripe/stripe-js'
import { useApiError } from '@/hooks/use-api-error'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripeCheckoutButtonProps {
  priceId: string | null
  planType: string
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outline'
}

export function StripeCheckoutButton({
  priceId,
  planType,
  children,
  className,
  variant = 'default'
}: StripeCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('profile')
  const tApi = useApiError()

  const getLocalizedPath = (path: string) => {
    return `/${locale}${path}`
  }

  const handleCheckout = async () => {
    if (!session) {
      router.push(getLocalizedPath('/auth/signin'))
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId || '', // 允许传递空字符串，让服务端处理
          planType,
          locale, // 传递当前语言
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(tApi(data.error) || t('payment_failed'))
      }

      const stripe = await stripePromise
      if (!stripe) {
        throw new Error(t('stripe_load_failed'))
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      })

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('支付错误:', error)
      alert(error instanceof Error ? error.message : t('payment_failed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading}
      className={className}
      variant={variant}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t('processing')}
        </>
      ) : (
        children
      )}
    </Button>
  )
} 