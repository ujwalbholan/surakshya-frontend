"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw } from "lucide-react"
import PageTransition from "@/components/admin/PageTransition"
import SosAlertQueue from "@/components/admin/SosAlertQueue"
import SosDetailPanel from "@/components/admin/SosDetailPanel"
import { MOCK_SOS_ALERTS, type MockSosAlert } from "@/lib/admin/mock-data"
import { useInterval } from "@/hooks/use-interval"

export default function SosPage() {
  const [alerts, setAlerts] = useState<MockSosAlert[]>(MOCK_SOS_ALERTS)
  const [selected, setSelected] = useState<MockSosAlert | null>(MOCK_SOS_ALERTS[0])
  const [lastRefresh, setLastRefresh] = useState(0)
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set())
  const [visibleCount, setVisibleCount] = useState(7)

  const refresh = useCallback(() => {
    setAlerts([...MOCK_SOS_ALERTS])
    setLastRefresh(0)
  }, [])

  useInterval(() => {
    setLastRefresh((s) => s + 1)
    if (lastRefresh > 0 && lastRefresh % 30 === 0) {
      refresh()
      setFlashIds(new Set([MOCK_SOS_ALERTS[0].id]))
      setTimeout(() => setFlashIds(new Set()), 1000)
    }
  }, 1000)

  useEffect(() => {
    const interval = setInterval(() => setLastRefresh((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const activeCount = alerts.filter((a) => a.status === "Active").length

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-[28px] italic text-white">SOS Alert Centre</h1>
          <span className="rounded-full bg-[#C0392B] px-2.5 py-0.5 font-mono-admin text-xs text-white">{activeCount} active</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-white/50">
          <span>Last refreshed: {lastRefresh}s ago</span>
          <button onClick={refresh} className="admin-btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[40%_60%]">
        <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
          <SosAlertQueue
            alerts={alerts.slice(0, visibleCount)}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
            onLoadMore={() => setVisibleCount((c) => c + 5)}
            flashIds={flashIds}
          />
        </div>
        <SosDetailPanel alert={selected} />
      </div>
    </PageTransition>
  )
}
