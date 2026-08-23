'use client'

import { useEffect } from 'react'

interface JsonLdProps {
  data: Record<string, unknown>
}

/**
 * Renders JSON-LD structured data by injecting a
 * <script type="application/ld+json"> tag into <head> on the client.
 *
 * Implemented as a client component (useEffect) instead of a server-rendered
 * <script> because Next.js 16 / React 19 would otherwise inject a
 * `nomodule` polyfill <script src="..."> alongside the inline JSON-LD tag,
 * causing a hydration mismatch with empty dangerouslySetInnerHTML on the
 * client side.
 *
 * The `<` characters are escaped to prevent premature script termination.
 */
export function JsonLd({ data }: JsonLdProps) {
  useEffect(() => {
    const json = JSON.stringify(data).replace(/</g, '\\u003c')
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = json
    script.dataset.jsonLd = 'true'
    document.head.appendChild(script)
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script)
    }
  }, [data])

  return null
}