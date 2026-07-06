"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "@/lib/auth/admin-session"

interface AdminAuthGuardProps {
  children: React.ReactNode
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    const ok = isAuthenticated()
    if (!ok) {
      router.push("/admin/login")
    } else {
      setAuthed(true)
    }
    setChecking(false)
  }, [router])

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="admin-pulse-dot h-3 w-3 rounded-full bg-[#C0392B]" />
      </div>
    )
  }

  if (!authed) return null

  return <>{children}</>
}
