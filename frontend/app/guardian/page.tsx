"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { Loader2, Shield } from "lucide-react"
import GuardianAuthGuard from "@/components/auth/GuardianAuthGuard"
import { fetchMyWards } from "@/lib/api/guardian"
import type { GuardianWard } from "@/lib/api/types"
import { getStoredEmail } from "@/lib/auth/session"

function GuardianHome() {
  const [wards, setWards] = useState<GuardianWard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const email = getStoredEmail()

  const loadWards = useCallback(async () => {
    setError(null)
    try {
      const result = await fetchMyWards()
      setWards(result.wards)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wards")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadWards()
  }, [loadWards])

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8 border-b border-[#222] pb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-[#2563eb]" />
          <div>
            <h1 className="text-lg font-semibold">Guardian portal</h1>
            <p className="text-sm text-[#888]">{email ?? "Guardian"}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-[#aaa]">
          Minimal shell for ward SOS monitoring. Full guardian app features
          (requests, OTP setup, notifications) are not yet implemented.
        </p>
      </header>

      {loading && (
        <div className="flex items-center gap-2 text-[#888]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading wards…
        </div>
      )}

      {error && (
        <div className="rounded border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && wards.length === 0 && (
        <p className="text-sm text-[#888]">No linked wards yet.</p>
      )}

      <ul className="space-y-3">
        {wards.map((ward) => (
          <li key={ward.id}>
            <Link
              href={`/guardian/wards/${ward.id}/sos`}
              className="block rounded-lg border border-[#222] bg-[#111] px-4 py-4 transition-colors hover:border-[#2563eb]/50"
            >
              <p className="font-medium">{ward.full_name}</p>
              <p className="text-xs text-[#666]">{ward.email}</p>
              <p className="mt-2 text-[10px] uppercase tracking-wider text-[#2563eb]">
                View SOS alerts →
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function GuardianPage() {
  return (
    <GuardianAuthGuard>
      <GuardianHome />
    </GuardianAuthGuard>
  )
}
