"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import {
  Filter,
  Mic,
  MapPin,
  Search,
  Watch,
  Radio,
  Clock,
} from "lucide-react"
import VictimProfilePanel from "@/components/dashboard/VictimProfilePanel"
import { Panel, SectionHeader, StatCard, StatusPill } from "@/components/dashboard/shared"
import { type AlertStatus, type SosAlert } from "@/lib/dashboard/police-types"
import { cn } from "@/lib/utils"

const FILTERS: { id: AlertStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "responding", label: "Responding" },
  { id: "resolved", label: "Resolved" },
]

const TIMELINE = [
  { time: "07:38:12", event: "Double-tap detected on wristband sensor", type: "trigger" },
  { time: "07:38:14", event: "Live GPS lock acquired — Thamel, Kathmandu", type: "gps" },
  { time: "07:38:16", event: "Victim profile pushed to Nepal Police dashboard", type: "system" },
  { time: "07:38:18", event: "Family contacts notified (3 numbers)", type: "notify" },
  { time: "07:38:22", event: "Auto audio evidence recording started", type: "evidence" },
  { time: "07:39:05", event: "Unit 12 — Metro acknowledged dispatch", type: "unit" },
]

interface SosAlertsViewProps {
  sosAlerts: SosAlert[]
  selectedAlert: SosAlert | undefined
  onSelectAlert: (id: string) => void
  onResolve?: (id: string, notes?: string) => Promise<void>
}

export default function SosAlertsView({
  sosAlerts,
  selectedAlert,
  onSelectAlert,
  onResolve,
}: SosAlertsViewProps) {
  const [filter, setFilter] = useState<AlertStatus | "all">("all")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    return sosAlerts.filter((a) => {
      const matchFilter = filter === "all" || a.status === filter
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        a.citizen.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.district.toLowerCase().includes(q)
      return matchFilter && matchSearch
    })
  }, [filter, search, sosAlerts])

  const counts = {
    all: sosAlerts.length,
    critical: sosAlerts.filter((a) => a.status === "critical").length,
    responding: sosAlerts.filter((a) => a.status === "responding").length,
    resolved: sosAlerts.filter((a) => a.status === "resolved").length,
  }

  return (
    <>
      <SectionHeader
        title="SOS Alert Queue"
        subtitle="Every alert originates from a Suraksha wristband double-tap. Officers receive victim photo, live GPS, medical info, and family contacts instantly."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="In queue" value={String(counts.all)} hint="All wristband signals" />
        <StatCard label="Critical" value={String(counts.critical)} hint="Needs immediate dispatch" trend="up" />
        <StatCard label="Responding" value={String(counts.responding)} hint="Units en route" trend="neutral" />
        <StatCard label="Resolved (24h)" value={String(counts.resolved)} hint="Closed today" trend="down" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
          <input
            type="search"
            placeholder="Search victim, ID, district…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-[#333] bg-[#0a0a0a] py-2.5 pl-10 pr-4 text-sm text-[#FAFAFA] placeholder:text-[#555] outline-none focus:border-[#C0392B]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "flex items-center gap-1.5 rounded border px-3 py-2 text-[10px] uppercase tracking-wider transition-colors",
                filter === f.id
                  ? "border-[#C0392B] bg-[#C0392B]/15 text-[#FAFAFA]"
                  : "border-[#333] text-[#666] hover:border-[#444] hover:text-[#FAFAFA]"
              )}
            >
              <Filter className="h-3 w-3" />
              {f.label}
              <span className="font-mono text-[#888]">({counts[f.id]})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <Panel title="Active alert queue" icon={Watch} headerRight={
            <span className="font-mono text-[10px] text-[#666]">{filtered.length} shown</span>
          }>
            <div className="space-y-2">
              {filtered.map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => onSelectAlert(alert.id)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded border p-3 text-left transition-colors",
                    selectedAlert?.id === alert.id
                      ? "border-[#C0392B] bg-[#C0392B]/10"
                      : "border-[#222] bg-[#0a0a0a] hover:border-[#333]"
                  )}
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-[#333]">
                    <Image src={alert.victim.photoUrl} alt="" fill className="object-cover" sizes="48px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-[#FAFAFA]">{alert.victim.fullName}</p>
                      <StatusPill variant={alert.status === "critical" ? "critical" : alert.status === "responding" ? "warning" : "success"}>
                        {alert.status}
                      </StatusPill>
                    </div>
                    <p className="mt-0.5 text-xs text-[#888]">
                      {alert.id} · {alert.district} · {alert.triggeredAt}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-[#C0392B]">
                      <Watch className="h-3 w-3" /> Double-tap · Blood {alert.victim.bloodType}
                    </p>
                  </div>
                  <MapPin className="h-4 w-4 shrink-0 text-[#666]" />
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Alert timeline (selected)" icon={Clock}>
            <p className="mb-3 text-xs text-[#888]">
              Chronological log from wristband activation to unit dispatch
            </p>
            <ul className="space-y-3">
              {TIMELINE.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-16 shrink-0 font-mono text-[10px] text-[#C0392B]">{item.time}</span>
                  <span className="text-xs text-[#ccc]">{item.event}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Evidence capture" icon={Mic}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded border border-[#222] bg-[#0a0a0a] p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#666]">Audio recording</p>
                <p className="mt-1 text-sm text-[#FAFAFA]">Auto-started on SOS trigger</p>
                <p className="mt-2 font-mono text-[10px] text-emerald-500">● Recording · AES-256</p>
              </div>
              <div className="rounded border border-[#222] bg-[#0a0a0a] p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#666]">GPS track</p>
                <p className="mt-1 text-sm text-[#FAFAFA]">5-second refresh interval</p>
                <p className="mt-2 font-mono text-[10px] text-[#C0392B]">● Live stream active</p>
              </div>
            </div>
          </Panel>
        </div>

        <div className="xl:col-span-2">
          {selectedAlert ? (
            <div className="sticky top-20 space-y-4">
              <VictimProfilePanel alert={selectedAlert} onResolve={onResolve} />
              <Panel title="Dispatch protocol" icon={Radio}>
                <ol className="list-decimal space-y-2 pl-4 text-xs text-[#aaa]">
                  <li>Acknowledge alert within 30 seconds</li>
                  <li>Contact victim via registered mobile</li>
                  <li>Dispatch nearest available unit</li>
                  <li>Notify family contacts on file</li>
                  <li>Maintain live GPS until case closed</li>
                  <li>Upload on-scene report to case file</li>
                </ol>
              </Panel>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#333] p-8 text-center text-sm text-[#666]">
              Select an alert to view full victim profile
            </div>
          )}
        </div>
      </div>
    </>
  )
}
