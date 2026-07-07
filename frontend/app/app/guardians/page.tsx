"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Users } from "lucide-react"
import GuardianList from "@/components/app/GuardianList"
import InviteGuardianForm from "@/components/app/InviteGuardianForm"
import PendingGuardianRequests from "@/components/app/PendingGuardianRequests"
import { getStoredEmail } from "@/lib/auth/session"

export default function GuardiansPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const email = getStoredEmail()

  const handleChanged = () => {
    setRefreshKey((key) => key + 1)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8 border-b border-[#222] pb-6">
        <Link
          href="/app"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-[#666] transition-colors hover:text-[#aaa]"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to home
        </Link>
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-[#2563eb]" />
          <div>
            <h1 className="text-lg font-semibold">Guardians</h1>
            <p className="text-sm text-[#888]">{email ?? "Citizen"}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-[#aaa]">
          Invite trusted guardians to monitor your SOS alerts, or respond to
          link requests from guardians who invited you.
        </p>
      </header>

      <div className="space-y-6">
        <PendingGuardianRequests
          refreshKey={refreshKey}
          onChanged={handleChanged}
        />
        <InviteGuardianForm onSuccess={handleChanged} />
        <GuardianList refreshKey={refreshKey} />
      </div>
    </div>
  )
}
