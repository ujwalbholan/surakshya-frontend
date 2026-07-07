"use client"

import Image from "next/image"
import { AlertTriangle, ChevronRight, Clock, MapPin, Shield, Watch } from "lucide-react"
import VictimProfilePanel from "@/components/dashboard/VictimProfilePanel"
import { Panel, StatCard } from "@/components/dashboard/shared"
import {
  provinceCoverage,
  recentActivity,
  type DashboardStat,
  type SosAlert,
} from "@/lib/dashboard/mock-data"
import { cn } from "@/lib/utils"

function AlertRow({
  alert,
  isSelected,
  onSelect,
}: {
  alert: SosAlert
  isSelected: boolean
  onSelect: () => void
}) {
  const statusStyles = {
    critical: "bg-[#C0392B]/20 text-[#E74C3C] border-[#C0392B]/40",
    responding: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  }
  return (
    <tr
      onClick={onSelect}
      className={cn(
        "cursor-pointer border-b border-[#222] transition-colors hover:bg-[#1a1a1a]/80",
        alert.status === "critical" && !isSelected && "bg-[#C0392B]/5",
        isSelected && "bg-[#C0392B]/15 ring-1 ring-inset ring-[#C0392B]/30"
      )}
    >
      <td className="px-4 py-3 font-mono text-xs text-[#888]">{alert.id}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded border border-[#333]">
            <Image src={alert.victim.photoUrl} alt="" fill className="object-cover" sizes="36px" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#FAFAFA]">{alert.citizen}</p>
            <p className="flex items-center gap-1 text-[10px] text-[#C0392B]">
              <Watch className="h-3 w-3" /> Double-tap
            </p>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 text-sm text-[#ccc] md:table-cell">{alert.location}</td>
      <td className="px-4 py-3 text-xs text-[#888]">{alert.triggeredAt}</td>
      <td className="px-4 py-3">
        <span className={cn("rounded border px-2 py-0.5 text-[10px] uppercase", statusStyles[alert.status])}>
          {alert.status}
        </span>
      </td>
    </tr>
  )
}

interface DashboardOverviewViewProps {
  sosAlerts: SosAlert[]
  dashboardStats: DashboardStat[]
  selectedAlert: SosAlert | undefined
  onSelectAlert: (id: string) => void
  criticalCount: number
  defaultCritical: SosAlert | undefined
  onResolve?: (id: string, notes?: string) => Promise<void>
}

export default function DashboardOverviewView({
  sosAlerts,
  dashboardStats,
  selectedAlert,
  onSelectAlert,
  criticalCount,
  defaultCritical,
  onResolve,
}: DashboardOverviewViewProps) {
  return (
    <>
      {criticalCount > 0 && defaultCritical && (
        <button
          type="button"
          onClick={() => onSelectAlert(defaultCritical.id)}
          className="mb-6 flex w-full items-center gap-3 rounded border border-[#C0392B]/40 bg-[#C0392B]/10 px-4 py-3 text-left transition-colors hover:bg-[#C0392B]/15"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-[#C0392B]" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#FAFAFA]">
              Wristband double-tap — {criticalCount} victim{criticalCount > 1 ? "s" : ""} need help
            </p>
            <p className="text-xs text-[#888]">Tap to view profile, live GPS & family contacts</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#666]" />
        </button>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} hint={stat.change} trend={stat.trend} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <Panel
            title="Live SOS — double-tap alerts"
            icon={Shield}
            headerRight={
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#666]">
                <Watch className="h-3 w-3 text-[#C0392B]" /> {sosAlerts.length} signals
              </span>
            }
          >
            <div className="overflow-x-auto -mx-4 -mb-4">
              <table className="w-full min-w-[520px] text-left">
                <thead>
                  <tr className="border-b border-[#222] font-mono text-[9px] uppercase text-[#555]">
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Victim</th>
                    <th className="hidden px-4 py-2 md:table-cell">Location</th>
                    <th className="px-4 py-2">Time</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sosAlerts.slice(0, 4).map((alert) => (
                    <AlertRow
                      key={alert.id}
                      alert={alert}
                      isSelected={selectedAlert?.id === alert.id}
                      onSelect={() => onSelectAlert(alert.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          {selectedAlert && (
            <div className="mt-6 xl:hidden">
              <VictimProfilePanel alert={selectedAlert} onResolve={onResolve} />
            </div>
          )}
        </div>
        <div className="hidden xl:col-span-2 xl:block">
          {selectedAlert && (
            <div className="sticky top-20">
              <VictimProfilePanel alert={selectedAlert} onResolve={onResolve} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Nepal coverage" icon={MapPin}>
          <ul className="space-y-2">
            {provinceCoverage.map((p) => (
              <li key={p.province} className="flex justify-between text-xs">
                <span className="text-[#888]">{p.province} Province</span>
                <span className="font-mono text-[#FAFAFA]">
                  {p.active} active · {p.units} units
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recent activity" icon={Clock}>
          <ul className="space-y-3">
            {recentActivity.map((item, i) => (
              <li key={i} className="border-l-2 border-[#222] pl-3">
                <p className="font-mono text-[9px] text-[#C0392B]">{item.time}</p>
                <p className="mt-0.5 text-xs text-[#aaa]">{item.text}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  )
}
