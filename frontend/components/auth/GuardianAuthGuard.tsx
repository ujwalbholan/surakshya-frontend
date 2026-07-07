"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAccessToken, getStoredRole } from "@/lib/auth/session"

function AuthLoading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#0a0a0a]"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#333] border-t-[#2563eb]" />
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#888]">
          Verifying guardian session
        </p>
      </div>
    </div>
  )
}

export default function GuardianAuthGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const token = getAccessToken()
    const role = getStoredRole()
    const isAuthorized = Boolean(token) && role === "GUARDIAN"
    setAuthorized(isAuthorized)
    setChecked(true)
    if (!token) {
      router.replace("/login?next=/guardian")
      return
    }
    if (role !== "GUARDIAN") {
      router.replace("/login")
    }
  }, [router])

  if (!checked || !authorized) {
    return <AuthLoading />
  }

  return <>{children}</>
}
