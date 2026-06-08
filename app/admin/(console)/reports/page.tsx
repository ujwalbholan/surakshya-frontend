"use client"

import { useState } from "react"
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
import PageTransition from "@/components/admin/PageTransition"
import { NEPAL_PROVINCES, generateSosChartData } from "@/lib/admin/mock-data"

const PROVINCE_DATA = NEPAL_PROVINCES.map((p, i) => ({
  province: p,
  sos: [42, 28, 35, 22, 18, 8, 12][i],
}))

const RESPONSE_DATA = generateSosChartData().map((d) => ({
  ...d,
  minutes: 3 + Math.random() * 4,
}))

const STATUS_DATA = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  open: Math.floor(Math.random() * 5) + 1,
  resolved: Math.floor(Math.random() * 8) + 3,
  escalated: Math.floor(Math.random() * 2),
}))

const GROWTH_DATA = Array.from({ length: 90 }, (_, i) => ({
  date: new Date(Date.now() - (89 - i) * 86400000).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  users: 900 + i * 4 + Math.floor(Math.random() * 10),
}))

const PROVINCE_TABLE = NEPAL_PROVINCES.map((p, i) => ({
  province: p,
  totalSos: [42, 28, 35, 22, 18, 8, 12][i],
  resolved: [38, 25, 30, 20, 15, 7, 10][i],
  avgResponse: ["4.1", "4.8", "5.2", "4.5", "5.0", "6.2", "5.8"][i],
  units: [4, 2, 3, 2, 1, 1, 1][i],
  coverage: [92, 78, 85, 70, 65, 45, 55][i],
}))

const RANGES = ["7 days", "30 days", "90 days", "Custom"] as const

export default function ReportsPage() {
  const [range, setRange] = useState<string>("30 days")

  const exportCsv = () => {
    const csv = "Province,Total SOS,Resolved,Avg Response,Units,Coverage\n" +
      PROVINCE_TABLE.map((r) => `${r.province},${r.totalSos},${r.resolved},${r.avgResponse},${r.units},${r.coverage}%`).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "suraksha-province-report.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported")
  }

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-[28px] italic text-white">Analytics & Reports</h1>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-3 py-1 text-xs transition ${range === r ? "bg-[#C0392B] text-white" : "bg-white/5 text-white/50 hover:text-white"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="admin-card">
          <h2 className="mb-4 text-sm font-semibold text-white">SOS Incidents by Province</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={PROVINCE_DATA}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="province" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
              <Bar dataKey="sos" fill="#C0392B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-card">
          <h2 className="mb-4 text-sm font-semibold text-white">Response Time Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={RESPONSE_DATA}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }} interval={4} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} unit=" min" />
              <Tooltip contentStyle={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
              <ReferenceLine y={5} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="minutes" stroke="#C0392B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-card">
          <h2 className="mb-4 text-sm font-semibold text-white">Cases by Status Over Time</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={STATUS_DATA}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }} interval={4} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
              <Area type="monotone" dataKey="open" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
              <Area type="monotone" dataKey="resolved" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
              <Area type="monotone" dataKey="escalated" stackId="1" stroke="#C0392B" fill="#C0392B" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-card">
          <h2 className="mb-4 text-sm font-semibold text-white">User Registration Growth</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={GROWTH_DATA}>
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C0392B" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#C0392B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }} interval={14} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
              <Area type="monotone" dataKey="users" stroke="#C0392B" fill="url(#growthGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-card mt-6 overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left font-mono-admin text-[10px] uppercase tracking-wider text-white/40">
              {["Province", "Total SOS", "Resolved", "Avg Response", "Units", "Coverage %"].map((h) => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROVINCE_TABLE.map((r) => (
              <tr key={r.province} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 text-white">{r.province}</td>
                <td className="px-4 py-3 text-white/70">{r.totalSos}</td>
                <td className="px-4 py-3 text-white/70">{r.resolved}</td>
                <td className="px-4 py-3 text-white/70">{r.avgResponse} min</td>
                <td className="px-4 py-3 text-white/70">{r.units}</td>
                <td className="px-4 py-3 text-white/70">{r.coverage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-3">
        <button onClick={exportCsv} className="admin-btn-primary">Export as CSV</button>
        <button onClick={() => toast("PDF export coming soon")} className="admin-btn-ghost">Export as PDF</button>
      </div>
    </PageTransition>
  )
}
