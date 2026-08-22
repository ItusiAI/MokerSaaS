import type { Metadata } from 'next'
import { ThemeProvider } from "@/components/providers/theme-provider"
import { AuthSessionProvider } from "@/components/providers/session-provider"
import { Analytics } from "@/components/seo/analytics"
import './globals.css'

const localeMap: Record<string, string> = {
  'en': 'en-US',
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  'ja': 'ja-JP',
  'ko': 'ko-KR',
}

function resolveHtmlLang(rawLocale: string | undefined): string {
  if (!rawLocale) return 'en'
  if (rawLocale in localeMap) return localeMap[rawLocale]
  const head = rawLocale.split('-')[0]
  return head || 'en'
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>
}): Promise<Metadata> {
  return {}
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale?: string }>
}) {
  const { locale } = await params
  const htmlLang = resolveHtmlLang(locale)

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