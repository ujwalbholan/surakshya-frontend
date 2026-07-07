"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import GuardianSetupWizard from "@/components/guardian/GuardianSetupWizard"

export default function GuardianSetupClient() {
  const searchParams = useSearchParams()
  const [initialEmail, setInitialEmail] = useState<string | undefined>(undefined)

  useEffect(() => {
    const value = searchParams.get("email")
    setInitialEmail(value?.trim() ?? "")
  }, [searchParams])

  if (initialEmail === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
      </div>
    )
  }

  return <GuardianSetupWizard initialEmail={initialEmail} />
}
