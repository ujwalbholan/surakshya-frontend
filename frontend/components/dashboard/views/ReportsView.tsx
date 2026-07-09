"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { BarChart3, Download, FileSpreadsheet, MapPin, TrendingUp } from "lucide-react"
import { Panel, SectionHeader, StatCard } from "@/components/dashboard/shared"
import {
  fetchPoliceCases,
  fetchPoliceEvidence,
  fetchPoliceReportSummary,
} from "@/lib/api/police"
import type { ReportMetric } from "@/lib/dashboard/operations-data"

const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  audio: "Audio recordings",
  gps: "GPS track logs",
  document: "Documents",
  witness: "Witness statements",
}

export default function ReportsView() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reportMetrics, setReportMetrics] = useState<ReportMetric[]>([])
  const [districtBreakdown, setDistrictBreakdown] = useState<
    { district: string; alerts: number; share: number }[]
  >([])
  const [evidenceTypes, setEvidenceTypes] = useState<{ type: string; count: number }[]>([])
  const [monthlySosStats, setMonthlySosStats] = useState<
    { month: string; alerts: number; resolved: number; avgMinutes: number }[]
  >([])

  const loadReports = useCallback(() => {
    setLoading(true)
    setLoadError(null)

    Promise.all([
      fetchPoliceReportSummary("30d"),
      fetchPoliceCases({ limit: 100 }),
      fetchPoliceEvidence({ limit: 100 }),
    ])
      .then(([summary, casesData, evidenceData]) => {
        setReportMetrics([
          {
            label: "SOS alerts",
            value: String(summary.total_sos),
            period: "Last 30 days",
            change: `${summary.resolution_rate}% resolved`,
            positive: summary.resolution_rate >= 80,
          },
          {
            label: "Avg response",
            value: `${summary.avg_response_minutes} min`,
            period: "Last 30 days",
            change: "Station average",
            positive: Number(summary.avg_response_minutes) <= 5,
          },
          {
            label: "Active cases",
            value: String(summary.active_cases),
            period: "Open now",
            change: `${summary.units_dispatched} units deployed`,
            positive: false,
          },
          {
            label: "Resolved",
            value: String(summary.resolved_count),
            period: "Last 30 days",
            change: `${summary.resolution_rate}% rate`,
            positive: true,
          },
        ])

        const districtMap = new Map<string, number>()
        for (const c of casesData.cases) {
          const district = c.district ?? "Unknown"
          districtMap.set(district, (districtMap.get(district) ?? 0) + 1)
        }
        const totalCases = casesData.cases.length || 1
        const districts = Array.from(districtMap.entries())
          .map(([district, alerts]) => ({
            district,
            alerts,
            share: Math.round((alerts / totalCases) * 100),
          }))
          .sort((a, b) => b.alerts - a.alerts)
          .slice(0, 6)
        setDistrictBreakdown(districts)

        const typeMap = new Map<string, number>()
        for (const e of evidenceData.evidence) {
          typeMap.set(e.file_type, (typeMap.get(e.file_type) ?? 0) + 1)
        }
        setEvidenceTypes(
          Array.from(typeMap.entries()).map(([type, count]) => ({
            type: EVIDENCE_TYPE_LABELS[type] ?? type,
            count,
          }))
        )

        setMonthlySosStats([
          {
            month: "Current",
            alerts: summary.total_sos,
            resolved: summary.resolved_count,
            avgMinutes: Number(summary.avg_response_minutes),
          },
        ])
        setLoading(false)
      })
      .catch((err: Error) => {
        setLoadError(err.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const maxAlerts = useMemo(
    () => Math.max(...monthlySosStats.map((m) => m.alerts), 1),
    [monthlySosStats]
  )

  if (loading) {
    return <p className="text-sm text-[#666]">Loading reports…</p>
  }

  if (loadError) {
    return (
      <div>
        <p className="text-sm text-red-400">{loadError}</p>
        <button type="button" onClick={loadReports} className="mt-2 text-xs text-[#888] underline">
          Retry
        </button>
      </div>
    )
  }

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
        <Panel title="SOS volume — 30 days" icon={BarChart3}>
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
          {monthlySosStats[0] && (
            <p className="mt-4 text-xs text-[#666]">
              Resolved: {monthlySosStats[0].resolved} / {monthlySosStats[0].alerts} · Avg{" "}
              {monthlySosStats[0].avgMinutes} min response
            </p>
          )}
        </Panel>

        <Panel title="District breakdown" icon={MapPin}>
          {districtBreakdown.length === 0 ? (
            <p className="text-sm text-[#666]">No case data for district breakdown</p>
          ) : (
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
          )}
        </Panel>

        <Panel title="Evidence collected" icon={TrendingUp}>
          {evidenceTypes.length === 0 ? (
            <p className="text-sm text-[#666]">No evidence files recorded</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {evidenceTypes.map((e) => (
                <div
                  key={e.type}
                  className="rounded border border-[#222] bg-[#0a0a0a] p-3"
                >
                  <p className="text-sm text-[#FAFAFA]">{e.type}</p>
                  <p className="mt-1 font-mono text-xl font-bold text-[#C0392B]">{e.count}</p>
                  <p className="text-[10px] text-[#666]">Station scope</p>
                </div>
              ))}
            </div>
          )}
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
