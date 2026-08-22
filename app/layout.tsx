import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { ThemeProvider } from "@/components/providers/theme-provider"
import { AuthSessionProvider } from "@/components/providers/session-provider"
import { Analytics } from "@/components/seo/analytics"
import './globals.css'

const SUPPORTED_LOCALES = ['en', 'zh-CN', 'ja', 'ko', 'zh-TW'] as const

const htmlLangMap: Record<(typeof SUPPORTED_LOCALES)[number], string> = {
  'en': 'en-US',
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  'ja': 'ja-JP',
  'ko': 'ko-KR',
}

const DEFAULT_HTML_LANG = 'en-US'

function resolveHtmlLang(rawLocale: string | string[] | undefined): string {
  const candidate = Array.isArray(rawLocale) ? rawLocale[0] : rawLocale
  const normalized = candidate?.trim()
  if (!normalized) return DEFAULT_HTML_LANG
  if (normalized in htmlLangMap) return htmlLangMap[normalized as keyof typeof htmlLangMap]
  const head = normalized.split('-')[0]?.toLowerCase()
  return head || DEFAULT_HTML_LANG
}

export async function generateMetadata(): Promise<Metadata> {
  return {}
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // next-intl middleware sets x-next-intl-locale on every matched request.
  // Root layout sits ABOVE [locale], so its own params never contains the
  // locale segment — read it from the request headers instead.
  const headerStore = await headers()
  const headerLocale = headerStore.get('x-next-intl-locale')
  const htmlLang = resolveHtmlLang(headerLocale ?? undefined)

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Analytics />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthSessionProvider>
            {children}
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}