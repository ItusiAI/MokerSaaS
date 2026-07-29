import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 设置推广码 Cookie（30天有效期）
 * 当用户访问 ?aff={affiliateCode} 时调用此函数
 */
export function setAffiliateCookie(affiliateCode: string) {
  if (typeof window === 'undefined') return
  
  const maxAge = 30 * 24 * 60 * 60 // 30天（秒）
  document.cookie = `aff=${encodeURIComponent(affiliateCode)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

/**
 * 获取推广码 Cookie
 */
export function getAffiliateCookie(): string | null {
  if (typeof window === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'aff') {
      return decodeURIComponent(value)
    }
  }
  return null
}
