"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import PoliceSetupWizard from "@/components/police/PoliceSetupWizard"

export default function PoliceSetupClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const value = searchParams.get("token")
    setToken(value)
  }, [searchParams])

  if (token === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C0392B]" />
      </div>
    )
  }

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#080808] px-4 text-center">
        <h1 className="text-xl font-semibold text-[#FAFAFA]">Invalid setup link</h1>
        <p className="mt-2 max-w-md text-sm text-[#888]">
          This link is missing a valid token. Check your invitation email or contact
          your administrator.
        </p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mt-6 text-xs uppercase tracking-wider text-[#C0392B] underline"
        >
          Go to login
        </button>
      </div>
    )
  }

  return <PoliceSetupWizard token={token} />
}
