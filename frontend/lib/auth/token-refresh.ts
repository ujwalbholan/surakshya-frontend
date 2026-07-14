"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { adminApiRequest } from "@/lib/api/client"
import { clearAdminSession } from "@/lib/auth/admin-session"

const REFRESH_INTERVAL_MS = 13 * 60 * 1000

export function useTokenRefresh() {
  const router = useRouter()

  useEffect(() => {
    const refresh = async () => {
      const { status, error } = await adminApiRequest<null>("/auth/refresh", {
        method: "POST",
      })

      if (status === 401 || (error && status !== 200 && status !== 204)) {
        clearAdminSession()
        toast.error("Session expired. Please sign in again.")
        router.push("/admin/login")
      }
    }

    const intervalId = window.setInterval(refresh, REFRESH_INTERVAL_MS)
    return () => window.clearInterval(intervalId)
  }, [router])
}
