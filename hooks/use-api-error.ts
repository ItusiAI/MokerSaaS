'use client'

import { useTranslations } from 'next-intl'

/**
 * 把 API 返回的 error / message 字符串解析成当前 locale 的本地化消息。
 * - 如果字符串是 apiErrors namespace 下的有效 key，则翻译
 * - 否则原样返回（兜底，比如服务端异常对象、动态拼接的字符串等）
 *
 * Usage:
 *   const tApi = useApiError()
 *   toast.error(tApi(data.error))
 */
export function useApiError() {
  const t = useTranslations('apiErrors')
  return (keyOrMessage: string | null | undefined): string => {
    if (!keyOrMessage) return ''
    // next-intl 没有 has() API，使用 try/catch 兜底
    try {
      return t(keyOrMessage as any)
    } catch {
      return keyOrMessage
    }
  }
}

export function useApiMessage() {
  return useApiError()
}
