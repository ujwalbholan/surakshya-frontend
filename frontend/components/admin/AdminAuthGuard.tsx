"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "@/lib/auth/admin-session"

interface AdminAuthGuardProps {
  children: React.ReactNode
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter()
  const authed = isAuthenticated()

  useEffect(() => {
    if (!authed) {
      router.push("/admin/login")
    }
  }, [router, authed])

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="admin-pulse-dot h-3 w-3 rounded-full bg-[#C0392B]" />
      </div>
    )
  }

  return <>{children}</>
}
