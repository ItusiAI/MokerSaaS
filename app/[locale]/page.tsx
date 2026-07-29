"use client"

import { useEffect, useState } from "react"
import { HomePageClient } from "@/components/home/home-page-client"

const NAVBAR_OFFSET = 80

const scrollToHash = (hash: string) => {
  const element = document.getElementById(hash)
  if (element) {
    const y = element.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET
    window.scrollTo({ top: y, behavior: "smooth" })
  }
}

export default function ChinesePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const hash = window.location.hash.replace('#', '')
    if (hash) {
      setTimeout(() => scrollToHash(hash), 100)
    }
  }, [])

  const handleOpenDeploy = () => scrollToHash('pricing')
  const handleOpenDocs = () => scrollToHash('orchestration')

  if (!mounted) {
    return null
  }

  return (
    <HomePageClient
      onOpenDeploy={handleOpenDeploy}
      onOpenDocs={handleOpenDocs}
    />
  )
}
