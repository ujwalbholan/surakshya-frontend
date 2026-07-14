"use client"

import { useCallback, useEffect, useState } from "react"
import PageTransition from "@/components/admin/PageTransition"
import { Skeleton } from "@/components/ui/skeleton"
import { checkHealth } from "@/lib/api/admin-auth"
import { Activity, Server, Database, Wifi } from "lucide-react"

interface HealthPayload {
  status?: string
  timestamp?: string
  uptime?: number
  uptime_ms?: number
  database?: "up" | "down"
  database_latency_ms?: number | null
}

function formatUptime(seconds?: number) {
  if (seconds == null || Number.isNaN(seconds)) return "—"
  const total = Math.floor(seconds)
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const mins = Math.floor((total % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m ${total % 60}s`
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadHealth = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    checkHealth().then(({ data, error, status }) => {
      if (error || !data || status < 200 || status >= 500) {
        setLoadError(error ?? "Failed to reach health endpoint")
        setHealth(data)
        setLoading(false)
        return
      }
      setHealth(data)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    loadHealth()
  }, [loadHealth])

  const dbUp = health?.database === "up"
  const overallOk = health?.status === "ok"

  const metrics = [
    {
      label: "System Uptime",
      value: formatUptime(health?.uptime),
      icon: Activity,
      color: overallOk ? "text-emerald-400" : "text-yellow-400",
    },
    {
      label: "API Latency",
      value:
        health?.database_latency_ms != null
          ? `${health.database_latency_ms}ms`
          : "—",
      icon: Server,
      color: "text-blue-400",
    },
    {
      label: "Database",
      value: health?.database === "up" ? "Healthy" : health?.database === "down" ? "Down" : "—",
      icon: Database,
      color: dbUp ? "text-emerald-400" : "text-red-400",
    },
    {
      label: "API Status",
      value: health?.status?.toUpperCase() ?? "—",
      icon: Wifi,
      color: overallOk ? "text-emerald-400" : "text-yellow-400",
    },
  ]

  return (
    <PageTransition>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-[28px] italic text-white">System Health</h1>
        <button onClick={loadHealth} className="admin-btn-ghost">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full bg-white/5" />
          ))}
        </div>
      ) : (
        <>
          {loadError && (
            <p className="mb-4 text-sm text-red-400">{loadError}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="admin-card">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/50">{label}</p>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <p className={`mt-2 text-2xl font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="admin-card mt-6">
            <h2 className="mb-4 text-sm font-semibold text-white">Service Status</h2>
            <div className="space-y-2">
              {[
                { name: "API Gateway", ok: !!health && !loadError },
                { name: "Database", ok: dbUp },
              ].map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between rounded-lg border border-white/5 px-4 py-2"
                >
                  <span className="text-sm text-white">{s.name}</span>
                  <span
                    className={`flex items-center gap-1.5 text-xs ${
                      s.ok ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        s.ok ? "admin-pulse-dot bg-emerald-400" : "bg-red-400"
                      }`}
                    />
                    {s.ok ? "Operational" : "Degraded"}
                  </span>
                </div>
              ))}
            </div>
            {health?.timestamp && (
              <p className="mt-4 font-mono-admin text-[10px] text-white/30">
                Checked {new Date(health.timestamp).toLocaleString()}
              </p>
            )}
          </div>
        </>
      )}
    </PageTransition>
  )
}
