"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import toast from "react-hot-toast"
import {
  Users,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Clock,
  Activity,
  Megaphone,
  Download,
  UserPlus,
  Settings,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import PageTransition from "@/components/admin/PageTransition"
import StatCard from "@/components/admin/StatCard"
import { PriorityBadge, StatusBadge, RoleBadge, ViewAllLink } from "@/components/admin/Badges"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { getAdminSession } from "@/lib/auth/admin-session"
import { fetchUserCount } from "@/lib/api/admin-auth"
import {
  DASHBOARD_SOS_ROWS,
  USER_ROLE_BREAKDOWN,
  LATEST_REGISTERED_USERS,
  generateSosChartData,
  getInitials,
} from "@/lib/admin/mock-data"

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function getNepalDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kathmandu",
  })
}

function getNepalTime(): string {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Kathmandu",
  })
}

export default function DashboardPage() {
  const session = getAdminSession()
  const [clock, setClock] = useState(getNepalTime())
  const [userCount, setUserCount] = useState<number>(1247)
  const [loadingStats, setLoadingStats] = useState(true)
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastMsg, setBroadcastMsg] = useState("")
  const chartData = generateSosChartData()

  useEffect(() => {
    const interval = setInterval(() => setClock(getNepalTime()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchUserCount().then(({ data }) => {
      if (data?.count) setUserCount(data.count)
      setLoadingStats(false)
    })
  }, [])

  const handleExportCsv = () => {
    const csv = "Date,Incidents\n" + chartData.map((d) => `${d.date},${d.count}`).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "suraksha-report.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Report exported")
  }

  const handleBroadcast = () => {
    toast.success("Alert broadcast queued")
    setBroadcastOpen(false)
    setBroadcastMsg("")
  }

  return (
    <PageTransition>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-body text-2xl font-medium tracking-tight text-white">
            {getGreeting()}, {session?.full_name ?? "Admin"}
          </h1>
          <p className="mt-1 font-mono-admin text-xs text-white/40">
            Command Centre · {getNepalDate()}
          </p>
        </div>
        <div className="font-mono-admin text-sm text-white/50">{clock} NPT</div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Users" value={userCount.toLocaleString()} icon={Users} loading={loadingStats} />
        <StatCard label="Active SOS" value={7} icon={AlertTriangle} />
        <StatCard label="Resolved Today" value={23} icon={CheckCircle} />
        <StatCard label="Units Deployed" value={14} icon={MapPin} />
        <StatCard label="Avg Response Time" value="4.2 min" icon={Clock} animate={false} />
        <StatCard label="System Health" value="Operational" icon={Activity} animate={false} pulse />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-[65%_35%]">
        {/* Left column */}
        <div className="space-y-6">
          {/* SOS table */}
          <div className="admin-card overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-white/5 px-5 py-4">
              <span className="admin-live-dot h-1.5 w-1.5 rounded-full bg-white/50" />
              <h2 className="font-body text-sm font-medium text-white/90">Live SOS Feed</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left font-mono-admin text-[10px] tracking-wider text-white/40 uppercase">
                    <th className="px-5 py-3">Time</th>
                    <th className="px-5 py-3">Victim</th>
                    <th className="px-5 py-3">Location</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {DASHBOARD_SOS_ROWS.map((row, i) => (
                    <tr
                      key={row.id}
                      className={`border-b border-white/5 transition hover:bg-white/5 ${i % 2 === 0 ? "bg-[#0A0A0A]" : ""}`}
                    >
                      <td className="px-5 py-3 font-mono-admin text-xs text-white/50">{row.time}</td>
                      <td className="px-5 py-3 text-white">{row.victim}</td>
                      <td className="px-5 py-3 text-white/70">{row.location}</td>
                      <td className="px-5 py-3"><PriorityBadge priority={row.priority} /></td>
                      <td className="px-5 py-3"><StatusBadge status={row.status} /></td>
                      <td className="px-5 py-3">
                        <Link href={`/admin/sos/${row.id}`} className="text-xs text-white/50 transition hover:text-white">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 pb-4">
              <ViewAllLink href="/admin/sos" label="View All Alerts" />
            </div>
          </div>

          {/* Line chart */}
          <div className="admin-card">
            <h2 className="mb-4 font-body text-sm font-medium text-white/90">SOS Incidents — Last 30 Days</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0A0A0A",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "6px",
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ fill: "#ffffff", r: 3, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Donut chart */}
          <div className="admin-card">
            <h2 className="mb-4 font-body text-sm font-medium text-white/90">User Breakdown</h2>
            <div className="relative">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={USER_ROLE_BREAKDOWN}
                    dataKey="count"
                    nameKey="role"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {USER_ROLE_BREAKDOWN.map((entry) => (
                      <Cell key={entry.role} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-center font-mono-admin text-sm text-white">
                  1,247<br /><span className="text-[10px] text-white/50">Total</span>
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {USER_ROLE_BREAKDOWN.map((r) => (
                <div key={r.role} className="flex items-center gap-2 text-xs text-white/60">
                  <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                  {r.role.replace("_", " ")} — {r.count.toLocaleString()}
                </div>
              ))}
            </div>
          </div>

          {/* Latest users */}
          <div className="admin-card">
            <h2 className="mb-4 font-body text-sm font-medium text-white/90">Latest Registered Users</h2>
            <ul className="space-y-3">
              {LATEST_REGISTERED_USERS.map((u) => (
                <li key={u.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-medium text-white/60">
                    {getInitials(u.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">{u.full_name}</p>
                    <RoleBadge role={u.role} />
                  </div>
                  <span className="shrink-0 font-mono-admin text-[10px] text-white/40">{u.timeAgo}</span>
                </li>
              ))}
            </ul>
            <ViewAllLink href="/admin/users" label="Manage Users" />
          </div>

          {/* Quick actions */}
          <div className="admin-card">
            <h2 className="mb-4 font-body text-sm font-medium text-white/90">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Register New User", icon: UserPlus, href: "/admin/users/new" },
                { label: "Broadcast Alert", icon: Megaphone, action: () => setBroadcastOpen(true) },
                { label: "Export Report", icon: Download, action: handleExportCsv },
                { label: "System Settings", icon: Settings, href: "/admin/settings" },
              ].map((action) => {
                const Icon = action.icon
                const cls = "flex flex-col items-center gap-2 rounded-md border border-white/8 p-3 text-xs text-white/50 transition hover:border-white/15 hover:bg-white/5 hover:text-white/80"
                if (action.href) {
                  return (
                    <Link key={action.label} href={action.href} className={cls}>
                      <Icon className="h-4 w-4" />
                      {action.label}
                    </Link>
                  )
                }
                return (
                  <button key={action.label} onClick={action.action} className={cls}>
                    <Icon className="h-4 w-4" />
                    {action.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent className="border-white/10 bg-[#0A0A0A] text-white">
          <DialogHeader>
            <DialogTitle>Broadcast Alert</DialogTitle>
          </DialogHeader>
          <Textarea
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            placeholder="Enter alert message to broadcast to all field units..."
            className="min-h-[100px] border-white/10 bg-black text-white"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBroadcastOpen(false)}>Cancel</Button>
            <Button onClick={handleBroadcast} className="bg-white text-black hover:bg-white/90">Send Broadcast</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
