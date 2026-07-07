"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, Loader2, Navigation, RefreshCw, Search, Siren } from "lucide-react"
import toast from "react-hot-toast"
import PageTransition from "@/components/admin/PageTransition"
import StatCard from "@/components/admin/StatCard"
import SosAlertQueue from "@/components/admin/SosAlertQueue"
import SosDetailPanel from "@/components/admin/SosDetailPanel"
import { cn } from "@/lib/utils"
import { useInterval } from "@/hooks/use-interval"
import {
  filterSosAlerts,
  getSosSummary,
  sortSosAlerts,
  type SosStatusFilter,
} from "@/lib/admin/sos-data"
import { loadAdminSosAlerts } from "@/lib/admin/sos-mappers"
import { resolveAdminSosEvent } from "@/lib/api/admin-sos"
import type { AdminSosAlert } from "@/lib/admin/sos-types"

const STATUS_FILTERS: { value: SosStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Active", label: "Active" },
  { value: "Dispatched", label: "Dispatched" },
  { value: "Resolved", label: "Resolved" },
]

export default function SosAlertCentre() {
  const [alerts, setAlerts] = useState<AdminSosAlert[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<SosStatusFilter>("all")
  const [lastRefresh, setLastRefresh] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set())
  const [visibleCount, setVisibleCount] = useState(7)

  const refresh = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true)
    setIsRefreshing(true)
    try {
      const nextAlerts = await loadAdminSosAlerts()
      setAlerts(nextAlerts)
      setError(null)
      setLastRefresh(0)
      setSelectedId((current) => {
        if (current && nextAlerts.some((alert) => alert.id === current)) return current
        return nextAlerts[0]?.id ?? null
      })
      setFlashIds(new Set(nextAlerts[0]?.id ? [nextAlerts[0].id] : []))
      window.setTimeout(() => setFlashIds(new Set()), 800)
    } catch {
      setError("Failed to load SOS alerts")
      setAlerts([])
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void refresh(true)
  }, [refresh])

  useInterval(() => {
    setLastRefresh((seconds) => {
      const next = seconds + 1
      if (next > 0 && next % 30 === 0) void refresh()
      return next
    })
  }, 1000)

  const filtered = useMemo(() => {
    const matched = filterSosAlerts(alerts, search, statusFilter)
    return sortSosAlerts(matched)
  }, [alerts, search, statusFilter])

  const visibleAlerts = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length
  const summary = useMemo(() => getSosSummary(alerts), [alerts])

  const selected = useMemo(
    () => alerts.find((a) => a.id === selectedId) ?? filtered[0] ?? null,
    [alerts, selectedId, filtered]
  )

  const handleResolve = async (id: string) => {
    const result = await resolveAdminSosEvent(id)
    if (result.error) {
      toast.error(result.error)
      return
    }

    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "Resolved" as const,
              timeline: [
                ...a.timeline,
                {
                  time: new Date().toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }),
                  description: "Marked resolved by operator",
                },
              ],
            }
          : a
      )
    )
    toast.success("Alert marked resolved")
  }

  const handleEscalate = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              priority: "CRITICAL" as const,
              timeline: [
                ...a.timeline,
                {
                  time: new Date().toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }),
                  description: "Escalated to Nepal Police priority",
                },
              ],
            }
          : a
      )
    )
    toast.success("Case escalated to priority")
  }

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[28px] italic text-white">SOS Alert Centre</h1>
            {summary.active > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C0392B]/30 bg-[#C0392B]/10 px-2.5 py-0.5 font-mono-admin text-xs text-[#C0392B]">
                <span className="admin-pulse-dot h-1.5 w-1.5 rounded-full bg-[#C0392B]" />
                {summary.active} active
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-white/40">
            Real-time wristband SOS queue · victim triage and dispatch coordination
          </p>
        </div>

        <div className="flex items-center gap-3 self-start text-sm text-white/45">
          <span className="font-mono-admin text-xs">Last refreshed: {lastRefresh}s ago</span>
          <button
            type="button"
            onClick={() => void refresh()}
            className="admin-btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-[#C0392B]/30 bg-[#C0392B]/10 px-4 py-3 text-sm text-[#E74C3C]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Alerts" value={summary.active} icon={Siren} animate={false} pulse={summary.active > 0} loading={loading} />
        <StatCard label="Dispatched" value={summary.dispatched} icon={Navigation} animate={false} loading={loading} />
        <StatCard label="Resolved Today" value={summary.resolved} icon={CheckCircle2} animate={false} loading={loading} />
        <StatCard label="Critical Open" value={summary.critical} icon={Siren} animate={false} pulse={summary.critical > 0} loading={loading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(300px,38%)_1fr]">
        <aside className="flex max-h-[calc(100vh-280px)] flex-col">
          <div className="mb-3 space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setVisibleCount(7)
                }}
                placeholder="Search alerts, victims, locations..."
                className="admin-input w-full pl-8 text-xs"
              />
            </div>
            <div className="inline-flex w-full rounded-lg border border-white/10 bg-black/40 p-0.5">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(filter.value)
                    setVisibleCount(7)
                  }}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition",
                    statusFilter === filter.value
                      ? "bg-white/10 text-white"
                      : "text-white/40 hover:text-white/70"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-white/30">
              {filtered.length} alert{filtered.length === 1 ? "" : "s"} in queue
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#0A0A0A]">
                <Loader2 className="h-6 w-6 animate-spin text-white/20" />
              </div>
            ) : (
              <SosAlertQueue
                alerts={visibleAlerts}
                selectedId={selected?.id ?? null}
                onSelect={(alert) => setSelectedId(alert.id)}
                onLoadMore={() => setVisibleCount((count) => count + 5)}
                hasMore={hasMore}
                flashIds={flashIds}
              />
            )}
          </div>
        </aside>

        <main className="min-h-[480px] lg:sticky lg:top-20 lg:self-start">
          <SosDetailPanel
            alert={selected}
            onResolve={handleResolve}
            onEscalate={handleEscalate}
          />
        </main>
      </div>
    </PageTransition>
  )
}
