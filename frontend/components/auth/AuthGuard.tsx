"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAccessToken } from "@/lib/auth/session"

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808]" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#333] border-t-[#C0392B]" />
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#888]">
          Verifying session
        </p>
      </div>
    </div>
  )
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const token = getAccessToken()
    const isAuthorized = Boolean(token)
    setAuthorized(isAuthorized)
    setChecked(true)
    if (!isAuthorized) {
      router.replace("/login")
      return
    }
    document.body.style.overflow = "auto"
  }, [router])

  if (!checked || !authorized) {
    return <AuthLoading />
  }

  return <>{children}</>
}
