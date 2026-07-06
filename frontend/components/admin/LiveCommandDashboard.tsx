"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Clock, ExternalLink, MapPin, Radio, Siren } from "lucide-react"
import PageTransition from "@/components/admin/PageTransition"
import StatCard from "@/components/admin/StatCard"
import { PriorityBadge, StatusBadge } from "@/components/admin/Badges"
import { cn } from "@/lib/utils"
import { mapsUrl } from "@/lib/admin/sos-data"
import {
  getActiveFeedAlerts,
  getLiveMapAlerts,
  getLiveSummary,
} from "@/lib/admin/live-data"
import { MOCK_SOS_ALERTS } from "@/lib/admin/mock-data"

const LiveCommandMap = dynamic(() => import("@/components/admin/LiveCommandMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[420px] items-center justify-center rounded-lg border border-white/5 bg-black/40">
      <div className="text-center">
        <MapPin className="mx-auto h-8 w-8 animate-pulse text-white/20" />
        <p className="mt-3 text-sm text-white/35">Loading map…</p>
      </div>
    </div>
  ),
})

export default function LiveCommandDashboard() {
  const [selectedId, setSelectedId] = useState<string | null>(
    MOCK_SOS_ALERTS.find((a) => a.status === "Active")?.id ?? null
  )

  const mapAlerts = useMemo(() => getLiveMapAlerts(MOCK_SOS_ALERTS), [])
  const feedAlerts = useMemo(() => getActiveFeedAlerts(MOCK_SOS_ALERTS), [])
  const summary = useMemo(() => getLiveSummary(MOCK_SOS_ALERTS), [])

  const selected = mapAlerts.find((a) => a.id === selectedId) ?? feedAlerts.find((a) => a.id === selectedId)

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Radio className="h-5 w-5 text-[#C0392B]" />
            <h1 className="font-display text-[28px] italic text-white">Live Command</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C0392B]/30 bg-[#C0392B]/10 px-2.5 py-0.5 font-mono-admin text-xs text-[#C0392B]">
              <span className="admin-live-dot h-1.5 w-1.5 rounded-full bg-[#C0392B]" />
              Live
            </span>
          </div>
          <p className="mt-1 text-sm text-white/40">
            Real-time SOS geolocation across Nepal · synced with wristband GPS locks
          </p>
        </div>
        <p className="self-start font-mono-admin text-xs text-white/35">
          {summary.onMap} incidents tracked · {summary.critical} critical
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active SOS" value={summary.active} icon={Siren} animate={false} pulse={summary.active > 0} />
        <StatCard label="Dispatched" value={summary.dispatched} icon={Radio} animate={false} />
        <StatCard label="On Map" value={summary.onMap} icon={MapPin} animate={false} />
        <StatCard label="Critical" value={summary.critical} icon={Siren} animate={false} pulse={summary.critical > 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="admin-card flex flex-col overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <div>
              <h2 className="font-body text-sm font-medium text-white/90">Operations Map</h2>
              <p className="mt-0.5 text-xs text-white/35">
                Victim GPS pins · accuracy rings · wristband live coordinates
              </p>
            </div>
            {selected && (
              <a
                href={mapsUrl(selected.lat, selected.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn-ghost inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px]"
              >
                <ExternalLink className="h-3 w-3" />
                Open selected
              </a>
            )}
          </div>
          <div className="min-h-[420px] flex-1 p-3 lg:min-h-[520px]">
            <LiveCommandMap
              alerts={mapAlerts}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        </div>

        <div className="admin-card flex flex-col p-0">
          <div className="border-b border-white/5 px-4 py-3">
            <h2 className="flex items-center gap-2 font-body text-sm font-medium text-white/90">
              <span className="admin-live-dot h-2 w-2 rounded-full bg-[#C0392B]" />
              Monitoring Feed
            </h2>
            <p className="mt-0.5 text-xs text-white/35">
              {feedAlerts.length} active alert{feedAlerts.length === 1 ? "" : "s"} requiring response
            </p>
          </div>

          <ul className="flex-1 space-y-2 overflow-y-auto p-3">
            {feedAlerts.length === 0 ? (
              <li className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-white/10 px-4 text-center">
                <Siren className="h-8 w-8 text-white/10" />
                <p className="mt-3 font-display text-lg italic text-white/35">No active alerts</p>
                <p className="mt-1 text-sm text-white/25">All clear across the network</p>
              </li>
            ) : (
              feedAlerts.map((alert) => {
                const isSelected = selectedId === alert.id
                return (
                  <li key={alert.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(alert.id)}
                      className={cn(
                        "w-full rounded-lg border p-3 text-left transition",
                        isSelected
                          ? "border-[#C0392B]/40 bg-[#C0392B]/[0.06] ring-1 ring-[#C0392B]/15"
                          : "border-white/5 bg-black/20 hover:border-white/10 hover:bg-white/[0.02]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-white">{alert.victim}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-white/50">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{alert.location}</span>
                          </p>
                          <p className="mt-1 font-mono-admin text-[10px] text-white/30">
                            {alert.lat.toFixed(4)}°N · {alert.lng.toFixed(4)}°E
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <PriorityBadge priority={alert.priority} />
                            <StatusBadge status={alert.status} />
                            <span className="inline-flex items-center gap-1 text-[10px] text-white/35">
                              <Clock className="h-3 w-3" />
                              {alert.timeAgo}
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/admin/sos/${alert.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 font-mono-admin text-[10px] text-[#C0392B] transition hover:text-[#E74C3C]"
                        >
                          {alert.id}
                        </Link>
                      </div>
                      {alert.assignedUnit && (
                        <p className="mt-2 text-[10px] text-white/35">
                          {alert.assignedUnit.name} · {alert.assignedUnit.status}
                        </p>
                      )}
                    </button>
                  </li>
                )
              })
            )}
          </ul>

          {mapAlerts.length > feedAlerts.length && (
            <div className="border-t border-white/5 px-4 py-3 text-[10px] text-white/30">
              +{mapAlerts.length - feedAlerts.length} dispatched incident
              {mapAlerts.length - feedAlerts.length === 1 ? "" : "s"} also visible on map
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
