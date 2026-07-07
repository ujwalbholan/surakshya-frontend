"use client"

import { Shield, Smartphone } from "lucide-react"
import { getStoredEmail } from "@/lib/auth/session"

export default function AppHomePage() {
  const email = getStoredEmail()

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8 border-b border-[#222] pb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-[#2563eb]" />
          <div>
            <h1 className="text-lg font-semibold">Suraksha</h1>
            <p className="text-sm text-[#888]">{email ?? "Citizen"}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-[#aaa]">
          Welcome to your citizen portal. Use the Suraksha mobile app to manage
          guardians, SOS, and your safety profile.
        </p>
      </header>

      <div className="flex items-start gap-4 rounded-lg border border-[#222] bg-[#111] px-4 py-4">
        <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-[#2563eb]" />
        <div>
          <p className="font-medium">Mobile app</p>
          <p className="mt-1 text-xs text-[#666]">
            Guardian linking, SOS, and account settings are available in the
            Suraksha app on your phone.
          </p>
        </div>
      </div>
    </div>
  )
}
