"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

/**
 * 处理OAuth登录后的推荐关系和推广返利关系
 * 在OAuth登录成功后，检查cookie中的推荐码和推广返利码并处理关系
 */
export function OAuthReferralHandler() {
  const { data: session, status } = useSession()
  const [processed, setProcessed] = useState(false)

  useEffect(() => {
    // 只在已登录且未处理过的情况下执行
    if (status !== 'authenticated' || processed || !session?.user?.id) {
      return
    }

    // 从cookie中读取推荐码和推广返利码
    const getCookie = (name: string): string | null => {
      if (typeof document === 'undefined') return null
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null
      }
      return null
    }

    const referralCode = getCookie('oauth_referral_code')
    const affiliateCode = getCookie('aff')

    // 如果没有推荐码和推广返利码，直接标记为已处理
    if (!referralCode && !affiliateCode) {
      setProcessed(true)
      return
    }

    // 处理推荐关系和推广返利关系
    const processRelations = async () => {
      try {
        // 处理推荐关系（如果有）
        if (referralCode) {
          try {
            const referralResponse = await fetch('/api/auth/oauth-referral', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ referralCode }),
            })

            if (referralResponse.ok) {
              // 删除推荐码cookie
              document.cookie = 'oauth_referral_code=; path=/; max-age=0'
              console.log('OAuth referral processed successfully')
            } else {
              const data = await referralResponse.json()
              console.error('Failed to process OAuth referral:', data.error)
            }
          } catch (error) {
            console.error('Error processing OAuth referral:', error)
          }
        }

        // 处理推广返利关系（如果有）
        if (affiliateCode) {
          try {
            const affiliateResponse = await fetch('/api/auth/oauth-affiliate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ affiliateCode }),
            })

            if (affiliateResponse.ok) {
              console.log('OAuth affiliate processed successfully')
              // 注意：不删除 aff cookie，因为它有30天有效期，可能在其他地方使用
            } else {
              const data = await affiliateResponse.json()
              console.error('Failed to process OAuth affiliate:', data.error)
            }
          } catch (error) {
            console.error('Error processing OAuth affiliate:', error)
          }
        }
      } catch (error) {
        console.error('Error processing OAuth relations:', error)
      } finally {
        setProcessed(true)
      }
    }

    // 延迟一点执行，确保用户已完全登录
    const timer = setTimeout(() => {
      processRelations()
    }, 1000)

    return () => clearTimeout(timer)
  }, [session, status, processed])

  return null // 这个组件不渲染任何内容
}




