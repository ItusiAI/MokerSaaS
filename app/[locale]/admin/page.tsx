import { requireAdmin } from '@/lib/auth-utils'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin.dashboard' })

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  }
}

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  // 验证管理员权限
  await requireAdmin()

  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin.dashboard' })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">{t('title')}</h1>
        <AdminDashboard />
      </div>
    </div>
  )
}
