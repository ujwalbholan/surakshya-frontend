"use client"

import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"
import PageTransition from "@/components/admin/PageTransition"
import { Skeleton } from "@/components/ui/skeleton"
import {
  createAdminApiKey,
  fetchAdminApiKeys,
  revokeAdminApiKey,
  type AdminApiKey,
} from "@/lib/api/admin-api-keys"
import { clearAdminSession } from "@/lib/auth/admin-session"
import { Key, Copy, Trash2 } from "lucide-react"

const API_KEY_PREFIX_VISIBLE_CHARS = 8

function formatRelative(iso: string | null | undefined) {
  if (!iso) return "Never"
  const diff = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(diff)) return "—"
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  return new Date(iso).toLocaleDateString()
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<AdminApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState("New API Key")

  const loadKeys = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    fetchAdminApiKeys().then(({ data, error, status }) => {
      if (status === 401) {
        clearAdminSession()
        return
      }
      if (status === 403) {
        setLoadError("Only SUPER_ADMIN can manage API keys")
        setLoading(false)
        return
      }
      if (error || !data) {
        setLoadError(error ?? "Failed to load API keys")
        setLoading(false)
        return
      }
      setKeys(data.api_keys.filter((k) => !k.revoked_at))
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    loadKeys()
  }, [loadKeys])

  const generateKey = async () => {
    setCreating(true)
    const { data, error, status } = await createAdminApiKey(nameInput.trim() || "New API Key")
    setCreating(false)
    if (status === 401) {
      clearAdminSession()
      return
    }
    if (error || !data) {
      toast.error(error ?? "Failed to generate API key")
      return
    }
    setNewSecret(data.secret)
    setKeys((prev) => [data.api_key, ...prev.filter((k) => k.id !== data.api_key.id)])
    toast.success("API key generated — copy it now; it will not be shown again")
  }

  const revokeKey = async (id: string) => {
    const { error, status } = await revokeAdminApiKey(id)
    if (status === 401) {
      clearAdminSession()
      return
    }
    if (error) {
      toast.error(error)
      return
    }
    setKeys((prev) => prev.filter((k) => k.id !== id))
    toast.success("API key revoked")
  }

  const copySecret = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Could not copy")
    }
  }

  return (
    <PageTransition>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Key className="h-5 w-5 text-[#C0392B]" />
          <h1 className="font-display text-[28px] italic text-white">API Keys</h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="admin-input w-48"
            placeholder="Key name"
          />
          <button
            onClick={generateKey}
            disabled={creating}
            className="admin-btn-primary"
          >
            {creating ? "Generating…" : "Generate Key"}
          </button>
        </div>
      </div>

      {newSecret && (
        <div className="admin-card mb-4 border border-[#C0392B]/40">
          <p className="text-sm font-medium text-white">New secret (shown once)</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 break-all font-mono-admin text-sm text-emerald-400">
              {newSecret}
            </code>
            <button
              onClick={() => copySecret(newSecret)}
              className="rounded p-2 text-white/40 hover:bg-white/5 hover:text-white"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setNewSecret(null)}
            className="mt-3 text-xs text-white/40 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full bg-white/5" />
          ))}
        </div>
      ) : loadError ? (
        <div className="admin-card py-12 text-center">
          <p className="text-sm text-red-400">{loadError}</p>
          <button onClick={loadKeys} className="admin-btn-ghost mt-4">
            Retry
          </button>
        </div>
      ) : keys.length === 0 ? (
        <div className="admin-card py-12 text-center">
          <p className="font-display text-lg italic text-white/50">No API keys</p>
          <button onClick={generateKey} className="admin-btn-primary mt-4">
            Generate your first key
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <div key={k.id} className="admin-card flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{k.name}</p>
                <p className="mt-1 font-mono-admin text-sm text-white/50">
                  {k.prefix.padEnd(API_KEY_PREFIX_VISIBLE_CHARS, "•")}
                  {"••••"}
                </p>
                <p className="mt-1 text-xs text-white/30">
                  Created {new Date(k.created_at).toLocaleDateString()} · Last used{" "}
                  {formatRelative(k.last_used_at)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copySecret(k.prefix)}
                  className="rounded p-2 text-white/40 hover:bg-white/5 hover:text-white"
                  title="Copy prefix"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => revokeKey(k.id)}
                  className="rounded p-2 text-white/40 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  )
}
