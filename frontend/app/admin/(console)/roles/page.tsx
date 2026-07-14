"use client"

import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"
import PageTransition from "@/components/admin/PageTransition"
import { Skeleton } from "@/components/ui/skeleton"
import {
  fetchAdminRolesMatrix,
  updateAdminRolesMatrix,
} from "@/lib/api/admin-roles"
import { clearAdminSession, getAdminSession } from "@/lib/auth/admin-session"
import { Check, X } from "lucide-react"

export default function RolesPage() {
  const session = getAdminSession()
  const canEdit = session?.role === "SUPER_ADMIN"

  const [roles, setRoles] = useState<string[]>([])
  const [permissions, setPermissions] = useState<string[]>([])
  const [matrix, setMatrix] = useState<Record<string, boolean[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  const loadMatrix = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    fetchAdminRolesMatrix().then(({ data, error, status }) => {
      if (status === 401) {
        clearAdminSession()
        return
      }
      if (error || !data) {
        setLoadError(error ?? "Failed to load roles matrix")
        setLoading(false)
        return
      }
      setRoles(data.roles)
      setPermissions(data.permissions)
      setMatrix(data.matrix)
      setDirty(false)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    loadMatrix()
  }, [loadMatrix])

  const toggle = (role: string, permIndex: number) => {
    if (!canEdit) return
    setMatrix((prev) => {
      const next = { ...prev }
      const row = [...(next[role] ?? [])]
      row[permIndex] = !row[permIndex]
      next[role] = row
      return next
    })
    setDirty(true)
  }

  const save = async () => {
    const entries = roles.flatMap((role) =>
      permissions.map((permission, i) => ({
        role,
        permission,
        allowed: matrix[role]?.[i] ?? false,
      })),
    )
    setSaving(true)
    const { data, error, status } = await updateAdminRolesMatrix(entries)
    setSaving(false)
    if (status === 401) {
      clearAdminSession()
      return
    }
    if (error || !data) {
      toast.error(error ?? "Failed to save matrix")
      return
    }
    setMatrix(data.matrix)
    setDirty(false)
    toast.success("Permission matrix saved")
  }

  return (
    <PageTransition>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-[28px] italic text-white">Roles & Permissions</h1>
        {canEdit && (
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="admin-btn-primary disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full bg-white/5" />
      ) : loadError ? (
        <div className="admin-card py-12 text-center">
          <p className="text-sm text-red-400">{loadError}</p>
          <button onClick={loadMatrix} className="admin-btn-ghost mt-4">
            Retry
          </button>
        </div>
      ) : (
        <div className="admin-card overflow-x-auto p-0">
          {!canEdit && (
            <p className="border-b border-white/5 px-4 py-2 text-xs text-white/40">
              Read-only — SUPER_ADMIN can edit this matrix. Access control still uses role enum membership.
            </p>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left font-mono-admin text-[10px] uppercase tracking-wider text-white/40">
                <th className="px-4 py-3">Permission</th>
                {roles.map((r) => (
                  <th key={r} className="px-4 py-3">
                    {r.replace("_", " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((perm, i) => (
                <tr key={perm} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-white">{perm}</td>
                  {roles.map((role) => {
                    const allowed = matrix[role]?.[i] ?? false
                    return (
                      <td key={role} className="px-4 py-3 text-center">
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => toggle(role, i)}
                          className="mx-auto block disabled:cursor-default"
                          aria-label={`${role} ${perm}`}
                        >
                          {allowed ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <X className="h-4 w-4 text-white/20" />
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageTransition>
  )
}
