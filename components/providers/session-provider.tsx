"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"
import { OAuthReferralHandler } from "@/components/auth/oauth-referral-handler"

interface Props {
  children: ReactNode
}

export function AuthSessionProvider({ children }: Props) {
  return (
    <SessionProvider>
      <OAuthReferralHandler />
      {children}
    </SessionProvider>
  )
} 