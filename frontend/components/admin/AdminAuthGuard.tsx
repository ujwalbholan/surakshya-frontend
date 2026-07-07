"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated, hasStaleAdminSession, clearAdminSession } from "@/lib/auth/admin-session"

interface AdminAuthGuardProps {
  children: React.ReactNode
}

function AdminAuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="admin-pulse-dot h-3 w-3 rounded-full bg-[#C0392B]" />
    </div>
  )
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    if (hasStaleAdminSession()) {
      clearAdminSession()
      router.push("/admin/login")
      return
    }
    const authenticated = isAuthenticated()
    setAuthed(authenticated)
    setChecked(true)
    if (!authenticated) {
      router.push("/admin/login")
    }
  }, [router])

  if (!checked || !authed) {
    return <AdminAuthLoading />
  }

  return <>{children}</>
}
