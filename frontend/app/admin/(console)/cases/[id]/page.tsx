"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import PageTransition from "@/components/admin/PageTransition"
import { PriorityBadge } from "@/components/admin/Badges"
import { MOCK_CASES } from "@/lib/admin/mock-data"

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const caseData = MOCK_CASES.find((c) => c.id === id || c.id.includes(id))
  if (!caseData) notFound()

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
            {caseData.evidenceFiles.map((f) => (
              <li key={f} className="font-mono-admin text-xs text-white/60">{f}</li>
            ))}
          </ul>
        </div>
      </div>
    </PageTransition>
  )
}
