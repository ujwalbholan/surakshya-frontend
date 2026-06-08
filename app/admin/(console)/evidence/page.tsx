"use client"

import PageTransition from "@/components/admin/PageTransition"
import { Lock } from "lucide-react"
import { MOCK_CASES } from "@/lib/admin/mock-data"

export default function EvidencePage() {
  const allFiles = MOCK_CASES.flatMap((c) =>
    c.evidenceFiles.map((f) => ({ file: f, caseId: c.id, victim: c.victim }))
  )

  return (
    <PageTransition>
      <h1 className="mb-6 font-display text-[28px] italic text-white">Evidence Vault</h1>
      <div className="admin-card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left font-mono-admin text-[10px] uppercase tracking-wider text-white/40">
              {["File", "Case ID", "Victim", "Encryption"].map((h) => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allFiles.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center font-display italic text-white/50">No evidence files</td></tr>
            ) : allFiles.map(({ file, caseId, victim }) => (
              <tr key={file} className="border-b border-white/5 hover:bg-white/5">
                <td className="flex items-center gap-2 px-4 py-3 font-mono-admin text-xs text-white/70">
                  <Lock className="h-3 w-3 text-white/30" />{file}
                </td>
                <td className="px-4 py-3 font-mono-admin text-xs text-white/50">{caseId}</td>
                <td className="px-4 py-3 text-white">{victim}</td>
                <td className="px-4 py-3 text-xs text-white/40">AES-256 Encrypted</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageTransition>
  )
}
