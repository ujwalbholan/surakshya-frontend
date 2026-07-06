"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import PageTransition from "@/components/admin/PageTransition"
import { MOCK_AUDIT_LOG, type AuditAction } from "@/lib/admin/mock-data"

const ACTION_STYLES: Record<AuditAction, string> = {
  LOGIN: "bg-blue-500/10 text-blue-400",
  CREATE_USER: "bg-emerald-500/10 text-emerald-400",
  UPDATE_CASE: "bg-yellow-500/10 text-yellow-400",
  DELETE_USER: "bg-[#C0392B]/10 text-[#C0392B]",
  LOGOUT: "bg-white/10 text-white/50",
  UPDATE_USER: "bg-yellow-500/10 text-yellow-400",
}

const ACTION_TYPES = ["All", "LOGIN", "CREATE_USER", "UPDATE_CASE", "DELETE_USER", "LOGOUT", "UPDATE_USER"] as const

export default function AuditTable() {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("All")
  const [entries] = useState(MOCK_AUDIT_LOG)

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase()
    const matchSearch = !q || e.admin.toLowerCase().includes(q) || e.action.toLowerCase().includes(q)
    const matchAction = actionFilter === "All" || e.action === actionFilter
    return matchSearch && matchAction
  })

  return (
    <PageTransition>
      <h1 className="mb-6 font-display text-[28px] italic text-white">Audit Log</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search admin or action..." className="admin-input w-64" />
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="admin-input w-40">
          {ACTION_TYPES.map((a) => <option key={a} value={a}>{a === "All" ? "All Actions" : a}</option>)}
        </select>
      </div>

      <div className="admin-card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left font-mono-admin text-[10px] uppercase tracking-wider text-white/40">
              {["Timestamp", "Admin", "Action", "Target", "IP Address", "Result"].map((h) => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="font-display text-lg italic text-white/50">No audit entries found</p>
                </td>
              </tr>
            ) : filtered.map((e) => (
              <tr key={e.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 font-mono-admin text-xs text-white/50">{e.timestamp}</td>
                <td className="px-4 py-3 text-white">{e.admin}</td>
                <td className="px-4 py-3">
                  <span className={cn("admin-badge text-[10px] font-mono-admin uppercase", ACTION_STYLES[e.action])}>
                    {e.action.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono-admin text-xs text-white/60">{e.target}</td>
                <td className="px-4 py-3 font-mono-admin text-xs text-white/40">{e.ipAddress}</td>
                <td className={cn("px-4 py-3 text-xs", e.result === "Success" ? "text-emerald-400" : "text-red-400")}>{e.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageTransition>
  )
}
