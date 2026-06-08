"use client"

import { useState } from "react"
import toast from "react-hot-toast"
import PageTransition from "@/components/admin/PageTransition"
import { Key, Copy, Trash2 } from "lucide-react"

interface ApiKey {
  id: string
  name: string
  prefix: string
  created: string
  lastUsed: string
}

const INITIAL_KEYS: ApiKey[] = [
  { id: "key-1", name: "Production Mobile App", prefix: "sk_live_••••7f3a", created: "2024-12-01", lastUsed: "2 min ago" },
  { id: "key-2", name: "Police Dashboard", prefix: "sk_live_••••9b2c", created: "2025-01-15", lastUsed: "1 hr ago" },
  { id: "key-3", name: "Webhook Integration", prefix: "sk_test_••••4d1e", created: "2025-03-20", lastUsed: "Never" },
]

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(INITIAL_KEYS)

  const generateKey = () => {
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: "New API Key",
      prefix: `sk_live_••••${Math.random().toString(36).slice(2, 6)}`,
      created: new Date().toISOString().split("T")[0],
      lastUsed: "Never",
    }
    setKeys((prev) => [newKey, ...prev])
    toast.success("API key generated")
  }

  const revokeKey = (id: string) => {
    setKeys((prev) => prev.filter((k) => k.id !== id))
    toast.success("API key revoked")
  }

  return (
    <PageTransition>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key className="h-5 w-5 text-[#C0392B]" />
          <h1 className="font-display text-[28px] italic text-white">API Keys</h1>
        </div>
        <button onClick={generateKey} className="admin-btn-primary">Generate Key</button>
      </div>

      <div className="space-y-3">
        {keys.length === 0 ? (
          <div className="admin-card py-12 text-center">
            <p className="font-display text-lg italic text-white/50">No API keys</p>
            <button onClick={generateKey} className="admin-btn-primary mt-4">Generate your first key</button>
          </div>
        ) : keys.map((k) => (
          <div key={k.id} className="admin-card flex items-center justify-between">
            <div>
              <p className="font-medium text-white">{k.name}</p>
              <p className="mt-1 font-mono-admin text-sm text-white/50">{k.prefix}</p>
              <p className="mt-1 text-xs text-white/30">Created {k.created} · Last used {k.lastUsed}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toast.success("Copied to clipboard")} className="rounded p-2 text-white/40 hover:bg-white/5 hover:text-white">
                <Copy className="h-4 w-4" />
              </button>
              <button onClick={() => revokeKey(k.id)} className="rounded p-2 text-white/40 hover:bg-red-500/10 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageTransition>
  )
}
