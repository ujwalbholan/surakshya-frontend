"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Shield } from "lucide-react"
import { fetchMyGuardians } from "@/lib/api/guardian"
import type { GuardianLinkUser } from "@/lib/api/types"

interface GuardianListProps {
  refreshKey?: number
}

export default function GuardianList({ refreshKey = 0 }: GuardianListProps) {
  const [guardians, setGuardians] = useState<GuardianLinkUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadGuardians = useCallback(async () => {
    setError(null)
    try {
      const result = await fetchMyGuardians()
      setGuardians(result.guardians)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load guardians")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    void loadGuardians()
  }, [loadGuardians, refreshKey])

  return (
    <section className="rounded-lg border border-[#222] bg-[#111] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-4 w-4 text-[#2563eb]" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#aaa]">
          Linked guardians
        </h2>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-[#888]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading guardians…
        </div>
      )}

      {error && (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && guardians.length === 0 && (
        <p className="text-sm text-[#666]">
          No guardians linked yet. Invite someone above or accept an incoming
          request.
        </p>
      )}

      <ul className="space-y-3">
        {guardians.map((guardian) => (
          <li
            key={guardian.id}
            className="rounded border border-[#222] bg-[#0a0a0a] px-4 py-3"
          >
            <p className="font-medium">{guardian.full_name}</p>
            <p className="text-xs text-[#666]">{guardian.email}</p>
            {guardian.phone && (
              <p className="mt-1 text-xs text-[#555]">{guardian.phone}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
