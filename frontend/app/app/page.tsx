"use client"

import Link from "next/link"
import { Shield, Users } from "lucide-react"
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
          Welcome to your citizen portal. Guardian linking is available now;
          additional features (device pairing, profile settings) are coming
          soon.
        </p>
      </header>

      <nav className="space-y-3">
        <Link
          href="/app/guardians"
          className="flex items-center gap-4 rounded-lg border border-[#222] bg-[#111] px-4 py-4 transition-colors hover:border-[#2563eb]/50"
        >
          <Users className="h-5 w-5 shrink-0 text-[#2563eb]" />
          <div>
            <p className="font-medium">Guardians</p>
            <p className="text-xs text-[#666]">
              Invite guardians and manage link requests
            </p>
          </div>
        </Link>
      </nav>

      {/* TODO: additional citizen features — device pairing, profile settings */}
    </div>
  )
}
