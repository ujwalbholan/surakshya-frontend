"use client"

import PageTransition from "@/components/admin/PageTransition"
import { Activity, Server, Database, Wifi } from "lucide-react"

const METRICS = [
  { label: "System Uptime", value: "99.97%", icon: Activity, color: "text-emerald-400" },
  { label: "API Latency", value: "142ms", icon: Server, color: "text-blue-400" },
  { label: "Database", value: "Healthy", icon: Database, color: "text-emerald-400" },
  { label: "WebSocket", value: "Connected", icon: Wifi, color: "text-emerald-400" },
  { label: "Active Connections", value: "847", icon: Activity, color: "text-white" },
  { label: "Error Rate (24h)", value: "0.03%", icon: Server, color: "text-yellow-400" },
]

export default function HealthPage() {
  return (
    <PageTransition>
      <h1 className="mb-6 font-display text-[28px] italic text-white">System Health</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {METRICS.map(({ label, value, icon: Icon, color }) => (
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
          {["Auth Service", "SOS Pipeline", "Notification Service", "GPS Tracker", "Evidence Storage"].map((s) => (
            <div key={s} className="flex items-center justify-between rounded-lg border border-white/5 px-4 py-2">
              <span className="text-sm text-white">{s}</span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="admin-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Operational
              </span>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  )
}
