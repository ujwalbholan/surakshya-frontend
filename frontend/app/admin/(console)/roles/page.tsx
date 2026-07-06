"use client"

import PageTransition from "@/components/admin/PageTransition"
import { Check, X } from "lucide-react"

const ROLES = ["SUPER_ADMIN", "ADMIN", "POLICE", "GUARDIAN", "USER"] as const
const PERMISSIONS = [
  "View All Users", "Manage Users", "View SOS Alerts", "Manage Cases",
  "Dispatch Units", "View Reports", "System Settings", "Audit Log", "API Keys",
]

const MATRIX: Record<string, boolean[]> = {
  SUPER_ADMIN: [true, true, true, true, true, true, true, true, true],
  ADMIN: [true, true, true, true, true, true, true, true, false],
  POLICE: [false, false, true, true, true, true, false, false, false],
  GUARDIAN: [false, false, true, false, false, false, false, false, false],
  USER: [false, false, false, false, false, false, false, false, false],
}

export default function RolesPage() {
  return (
    <PageTransition>
      <h1 className="mb-6 font-display text-[28px] italic text-white">Roles & Permissions</h1>
      <div className="admin-card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left font-mono-admin text-[10px] uppercase tracking-wider text-white/40">
              <th className="px-4 py-3">Permission</th>
              {ROLES.map((r) => <th key={r} className="px-4 py-3">{r.replace("_", " ")}</th>)}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((perm, i) => (
              <tr key={perm} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 text-white">{perm}</td>
                {ROLES.map((role) => (
                  <td key={role} className="px-4 py-3 text-center">
                    {MATRIX[role][i] ? (
                      <Check className="mx-auto h-4 w-4 text-emerald-400" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-white/20" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageTransition>
  )
}
