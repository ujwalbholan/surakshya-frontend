"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/** Legacy email-first setup — guardians now activate via login + /guardian/activate. */
export default function GuardianSetupClient() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/login?guardianSetup=1")
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#080808] px-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#C0392B]" />
      <p className="mt-4 max-w-sm text-sm text-[#888]">
        Guardian setup now starts at login. Sign in with your temporary password
        to change it and verify your phone.
      </p>
    </div>
  )
}
