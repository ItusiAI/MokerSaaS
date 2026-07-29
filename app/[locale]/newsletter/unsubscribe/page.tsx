"use client"

import { UnsubscribeForm } from '@/components/newsletter/unsubscribe-form'

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-16 max-w-2xl">
        <UnsubscribeForm />
      </main>
    </div>
  )
} 