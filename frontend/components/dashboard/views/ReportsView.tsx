"use client"

import { BarChart3, Download, FileSpreadsheet, MapPin, TrendingUp } from "lucide-react"
import { Panel, SectionHeader, StatCard } from "@/components/dashboard/shared"
// TODO: no backend endpoint yet
import {
  districtBreakdown,
  evidenceTypes,
  monthlySosStats,
  reportMetrics,
} from "@/lib/dashboard/operations-data"

export default function ReportsView() {
  const maxAlerts = Math.max(...monthlySosStats.map((m) => m.alerts))

  return (
    <>
      <SectionHeader
        title="Operational reports"
        subtitle="Suraksha network analytics for Nepal Police HQ — exportable summaries and provincial breakdowns."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              className="flex items-center gap-2 rounded border border-[#333] px-4 py-2 text-[10px] uppercase tracking-wider text-[#888] hover:text-[#FAFAFA]"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              CSV
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded border border-[#C0392B] bg-[#C0392B]/10 px-4 py-2 text-[10px] uppercase tracking-wider text-[#E74C3C] hover:bg-[#C0392B]/20"
            >
              <Download className="h-3.5 w-3.5" />
              PDF report
            </button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {reportMetrics.map((m) => (
          <StatCard
            key={m.label}
            label={m.label}
            value={m.value}
            hint={`${m.period} · ${m.change}`}
            trend={m.positive ? "down" : "up"}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="SOS volume — 6 months" icon={BarChart3}>
          <div className="flex h-48 items-end justify-between gap-2 pt-4">
            {monthlySosStats.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t bg-[#C0392B]/80 transition-all"
                  style={{ height: `${(m.alerts / maxAlerts) * 140}px` }}
                  title={`${m.alerts} alerts`}
                />
                <span className="font-mono text-[9px] text-[#666]">{m.month}</span>
                <span className="text-[10px] text-[#888]">{m.alerts}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-[#666]">
            Resolved: {monthlySosStats[5].resolved} / {monthlySosStats[5].alerts} in May · Avg{" "}
            {monthlySosStats[5].avgMinutes} min response
          </p>
        </Panel>

        <Panel title="District breakdown" icon={MapPin}>
          <ul className="space-y-3">
            {districtBreakdown.map((d) => (
              <li key={d.district}>
                <div className="flex justify-between text-xs">
                  <span className="text-[#ccc]">{d.district}</span>
                  <span className="font-mono text-[#FAFAFA]">
                    {d.alerts} ({d.share}%)
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#222]">
                  <div
                    className="h-full rounded-full bg-[#C0392B]"
                    style={{ width: `${d.share}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Evidence collected" icon={TrendingUp}>
          <div className="grid gap-3 sm:grid-cols-2">
            {evidenceTypes.map((e) => (
              <div
                key={e.type}
                className="rounded border border-[#222] bg-[#0a0a0a] p-3"
              >
                <p className="text-sm text-[#FAFAFA]">{e.type}</p>
                <p className="mt-1 font-mono text-xl font-bold text-[#C0392B]">{e.count}</p>
                <p className="text-[10px] text-[#666]">Last 30 days</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Scheduled reports" icon={Download}>
          <ul className="space-y-3 text-sm">
            {[
              { name: "Daily SOS summary", schedule: "Every day · 06:00 NPT", format: "PDF + email" },
              { name: "Weekly provincial brief", schedule: "Monday · 08:00 NPT", format: "PDF" },
              { name: "Monthly HQ dashboard", schedule: "1st of month", format: "CSV + PDF" },
              { name: "Quarterly audit trail", schedule: "Jan, Apr, Jul, Oct", format: "Encrypted archive" },
            ].map((r) => (
              <li
                key={r.name}
                className="flex items-center justify-between rounded border border-[#222] bg-[#0a0a0a] px-3 py-2.5"
              >
                <div>
                  <p className="text-[#FAFAFA]">{r.name}</p>
                  <p className="text-xs text-[#666]">{r.schedule}</p>
                </div>
                <span className="font-mono text-[10px] text-[#888]">{r.format}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  )
}
