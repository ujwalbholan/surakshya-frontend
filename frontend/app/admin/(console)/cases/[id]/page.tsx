"use client"

import { use, useEffect, useState } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import PageTransition from "@/components/admin/PageTransition"
import { PriorityBadge } from "@/components/admin/Badges"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchAdminCase, fetchAdminCases } from "@/lib/api/admin-cases"
import { fetchAdminEvidence } from "@/lib/api/admin-evidence"
import { clearAdminSession } from "@/lib/auth/admin-session"
import { mapApiCaseDetailToMockCase } from "@/lib/admin/case-mappers"
import type { MockCase } from "@/lib/admin/domain-types"

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [caseData, setCaseData] = useState<MockCase | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)

      let resolvedId = id
      let result = await fetchAdminCase(id)

      if (result.status === 404 || (result.error && !result.data)) {
        const listRes = await fetchAdminCases({ limit: 100 })
        const match = listRes.data?.cases.find(
          (c) => c.case_number === id || c.id === id
        )
        if (match) {
          resolvedId = match.id
          result = await fetchAdminCase(match.id)
        }
      }

      const { data, error, status } = result
      if (cancelled) return

      if (status === 401) {
        clearAdminSession()
        return
      }
      if (status === 404 || error || !data?.case) {
        setNotFoundState(true)
        setLoading(false)
        return
      }

      const mapped = mapApiCaseDetailToMockCase(data.case)
      const evidenceRes = await fetchAdminEvidence({ case_id: resolvedId, limit: 50 })
      if (!cancelled && evidenceRes.data) {
        mapped.evidenceCount = evidenceRes.data.total
        mapped.evidenceFiles = evidenceRes.data.evidence.map((e) => e.file_name)
      }

      setCaseData(mapped)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <PageTransition>
        <Skeleton className="mb-4 h-5 w-32" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-6 h-48 w-full rounded-xl" />
      </PageTransition>
    )
  }

  if (notFoundState || !caseData) notFound()

  return (
    <PageTransition>
      <Link href="/admin/cases" className="mb-4 inline-block text-sm text-white/50 hover:text-[#C0392B]">← Back to Cases</Link>
      <h1 className="mb-2 font-display text-[28px] italic text-white">{caseData.id}</h1>
      <div className="admin-card space-y-4">
        <div className="flex items-center gap-3">
          <PriorityBadge priority={caseData.priority} />
          <span className="text-sm capitalize text-white/60">{caseData.status.toLowerCase()}</span>
        </div>
        <p className="text-white">{caseData.victim} · {caseData.district}, {caseData.province}</p>
        <p className="text-white/50">Assigned: {caseData.officer}</p>
        <p className="text-white/50">Opened: {caseData.openedAt}</p>
        <div>
          <h3 className="mb-2 text-xs font-mono-admin uppercase text-white/40">Evidence ({caseData.evidenceCount} files)</h3>
          <ul className="space-y-1">
            {caseData.evidenceFiles.length === 0 ? (
              <li className="text-xs text-white/40">No evidence files recorded</li>
            ) : (
              caseData.evidenceFiles.map((f) => (
                <li key={f} className="font-mono-admin text-xs text-white/60">{f}</li>
              ))
            )}
          </ul>
        </div>
        {caseData.notes.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-mono-admin uppercase text-white/40">Notes</h3>
            <ul className="space-y-2">
              {caseData.notes.map((note, i) => (
                <li key={i} className="text-sm text-white/70">{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
