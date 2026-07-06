"use client"

import { useMemo, useState, type ReactNode } from "react"
import toast from "react-hot-toast"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import {
  Activity,
  Clock,
  Download,
  FileSpreadsheet,
  MapPin,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react"
import PageTransition from "@/components/admin/PageTransition"
import StatCard from "@/components/admin/StatCard"
import { cn } from "@/lib/utils"
import {
  REPORT_RANGES,
  PROVINCE_BAR_DATA,
  buildProvinceCsv,
  getProvinceTableForRange,
  getReportSummary,
  getResponseTrend,
  getStatusTrend,
  getUserGrowth,
  type ReportRange,
} from "@/lib/admin/reports-data"

const AXIS_TICK = { fill: "rgba(255,255,255,0.35)", fontSize: 10 }
const GRID_STROKE = "rgba(255,255,255,0.04)"

const TOOLTIP_STYLE = {
  background: "#0A0A0A",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  color: "rgba(255,255,255,0.85)",
  fontSize: 12,
  padding: "8px 12px",
}

function ChartCard({
  title,
  subtitle,
  legend,
  children,
}: {
  title: string
  subtitle?: string
  legend?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="admin-card flex flex-col">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-body text-sm font-medium text-white/90">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-white/35">{subtitle}</p>}
        </div>
        {legend}
      </div>
      {children}
    </div>
  )
}

function StatusLegend() {
  const items = [
    { label: "Open", color: "#3B82F6" },
    { label: "Resolved", color: "#10B981" },
    { label: "Escalated", color: "#C0392B" },
  ]

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5 text-[10px] text-white/45">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

function CoverageBar({ value }: { value: number }) {
  const tone =
    value >= 80 ? "bg-emerald-400/70" : value >= 60 ? "bg-white/50" : "bg-amber-400/60"

  return (
    <div className="flex min-w-[120px] items-center gap-2">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-right font-mono-admin text-xs text-white/60">{value}%</span>
    </div>
  )
}

export default function ReportsDashboard() {
  const [range, setRange] = useState<ReportRange>("30 days")

  const summary = useMemo(() => getReportSummary(range), [range])
  const responseData = useMemo(() => getResponseTrend(range), [range])
  const statusData = useMemo(() => getStatusTrend(range), [range])
  const growthData = useMemo(() => getUserGrowth(range), [range])
  const tableData = useMemo(() => getProvinceTableForRange(range), [range])

  const xInterval = range === "7 days" ? 0 : range === "90 days" ? 13 : 4
  const growthInterval = range === "90 days" ? 13 : range === "7 days" ? 0 : 4

  const exportCsv = () => {
    const csv = buildProvinceCsv(tableData)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `suraksha-province-report-${range.replace(" ", "-")}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported")
  }

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-[28px] italic text-white">Analytics & Reports</h1>
          <p className="mt-1 text-sm text-white/40">
            Provincial SOS volume, response performance, and registration trends
          </p>
        </div>

        <div className="inline-flex self-start rounded-lg border border-white/10 bg-black/40 p-0.5">
          {REPORT_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                range === r
                  ? "bg-[#C0392B] text-white shadow-sm"
                  : "text-white/45 hover:text-white/80"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total SOS" value={summary.totalSos} icon={Activity} />
        <StatCard label="Avg Response" value={`${summary.avgResponse} min`} icon={Clock} />
        <StatCard label="Resolution Rate" value={`${summary.resolutionRate}%`} icon={ShieldCheck} />
        <StatCard label="Network Coverage" value={`${summary.avgCoverage}%`} icon={TrendingUp} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="SOS Incidents by Province" subtitle="Distribution across all seven provinces">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={PROVINCE_BAR_DATA} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="shortLabel"
                tick={AXIS_TICK}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
                interval={0}
              />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                formatter={(value) => [`${value} incidents`, "SOS"]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.province ?? ""}
              />
              <Bar
                dataKey="sos"
                fill="#C0392B"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                activeBar={{ fill: "#E74C3C" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Response Time Trend"
          subtitle="Daily average dispatch-to-arrival time"
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={responseData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={AXIS_TICK}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
                interval={xInterval}
              />
              <YAxis
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                width={36}
                tickFormatter={(v) => `${v}`}
                unit="m"
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                formatter={(value) => [`${value} min`, "Avg response"]}
              />
              <ReferenceLine
                y={5}
                stroke="rgba(255,255,255,0.2)"
                strokeDasharray="4 4"
                label={{
                  value: "5 min target",
                  position: "insideTopRight",
                  fill: "rgba(255,255,255,0.25)",
                  fontSize: 10,
                }}
              />
              <Line
                type="monotone"
                dataKey="minutes"
                stroke="#C0392B"
                strokeWidth={2}
                dot={false}
                activeDot={{ fill: "#C0392B", r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Cases by Status Over Time"
          subtitle="Open, resolved, and escalated volume"
          legend={<StatusLegend />}
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={statusData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={AXIS_TICK}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
                interval={xInterval}
              />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "rgba(255,255,255,0.5)" }} />
              <Area
                type="monotone"
                dataKey="open"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.22}
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="resolved"
                stackId="1"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.22}
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="escalated"
                stackId="1"
                stroke="#C0392B"
                fill="#C0392B"
                fillOpacity={0.18}
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="User Registration Growth" subtitle="Cumulative registered users on platform">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={growthData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C0392B" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#C0392B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={AXIS_TICK}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
                interval={growthInterval}
              />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                formatter={(value) => [value, "Users"]}
              />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#C0392B"
                strokeWidth={2}
                fill="url(#growthGrad)"
                activeDot={{ fill: "#C0392B", r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="admin-card mt-6 overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-white/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-body text-sm font-medium text-white/90">Province Breakdown</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/35">
              <MapPin className="h-3 w-3" />
              Operational metrics by region · {range}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={exportCsv} className="admin-btn-primary inline-flex items-center gap-2 text-xs">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => toast("PDF export coming soon")}
              className="admin-btn-ghost inline-flex items-center gap-2 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left font-mono-admin text-[10px] tracking-wider text-white/40 uppercase">
                {["Province", "Total SOS", "Resolved", "Rate", "Avg Response", "Units", "Coverage"].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.province} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 font-medium text-white">{row.province}</td>
                  <td className="px-5 py-3.5 font-mono-admin text-xs text-white/70">{row.totalSos}</td>
                  <td className="px-5 py-3.5 font-mono-admin text-xs text-white/70">{row.resolved}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        "font-mono-admin text-xs",
                        row.resolutionRate >= 90 ? "text-emerald-400/80" : "text-white/55"
                      )}
                    >
                      {row.resolutionRate}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono-admin text-xs text-white/60">{row.avgResponse} min</td>
                  <td className="px-5 py-3.5 font-mono-admin text-xs text-white/60">{row.units}</td>
                  <td className="px-5 py-3.5">
                    <CoverageBar value={row.coverage} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-white/[0.02] text-xs text-white/45">
                <td className="px-5 py-3 font-medium text-white/60">All provinces</td>
                <td className="px-5 py-3 font-mono-admin">{tableData.reduce((s, r) => s + r.totalSos, 0)}</td>
                <td className="px-5 py-3 font-mono-admin">{tableData.reduce((s, r) => s + r.resolved, 0)}</td>
                <td className="px-5 py-3 font-mono-admin">{summary.resolutionRate}%</td>
                <td className="px-5 py-3 font-mono-admin">{summary.avgResponse} min</td>
                <td className="px-5 py-3 font-mono-admin">{summary.activeUnits}</td>
                <td className="px-5 py-3">
                  <CoverageBar value={summary.avgCoverage} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-[10px] text-white/25">
        <Users className="h-3 w-3" />
        Data reflects mock operational metrics · syncs with backend when API is connected
      </p>
    </PageTransition>
  )
}
