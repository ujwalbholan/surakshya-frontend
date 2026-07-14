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
import { Skeleton } from "@/components/ui/skeleton"
import { getAdminSession } from "@/lib/auth/admin-session"
import {
  fetchAdminStats,
  fetchUsers,
  type AdminStatsResponse,
  type AdminUserRecord,
} from "@/lib/api/admin-auth"
import { fetchAdminSosEvents } from "@/lib/api/admin-sos"
import { sendAdminBroadcast } from "@/lib/api/admin-broadcast"
import { sortSosAlerts } from "@/lib/admin/sos-data"
import { loadAdminSosAlerts } from "@/lib/admin/sos-mappers"
import type { AdminSosAlert } from "@/lib/admin/sos-types"

const ROLE_CHART_COLORS: Record<string, string> = {
  USER: "rgba(255,255,255,0.85)",
  POLICE: "rgba(255,255,255,0.6)",
  GUARDIAN: "rgba(255,255,255,0.45)",
  ADMIN: "rgba(255,255,255,0.3)",
  SUPER_ADMIN: "rgba(255,255,255,0.15)",
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr ago`
  const diffDays = Math.floor(diffHr / 24)
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
  return date.toLocaleDateString()
}

function buildSosChartData(events: { startedAt: string }[]) {
  const now = new Date()
  const buckets = new Map<string, number>()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    buckets.set(date.toISOString().slice(0, 10), 0)
  }

  for (const event of events) {
    const key = event.startedAt.slice(0, 10)
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1)
    }
  }

  return Array.from(buckets.entries()).map(([key, count]) => ({
    date: new Date(key).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    count,
  }))
}

interface LatestUserRow {
  id: string
  full_name: string
  role: string
  timeAgo: string
}

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
  const [stats, setStats] = useState<AdminStatsResponse | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [latestUsers, setLatestUsers] = useState<LatestUserRow[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<{ date: string; count: number }[]>([])
  const [loadingChart, setLoadingChart] = useState(true)
  const [chartError, setChartError] = useState<string | null>(null)
  const [sosAlerts, setSosAlerts] = useState<AdminSosAlert[]>([])
  const [loadingSos, setLoadingSos] = useState(true)
  const [sosError, setSosError] = useState<string | null>(null)
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastMsg, setBroadcastMsg] = useState("")

  const roleBreakdown = (stats?.usersByRole ?? []).map((entry) => ({
    ...entry,
    color: ROLE_CHART_COLORS[entry.role] ?? "rgba(255,255,255,0.2)",
  }))

  useEffect(() => {
    const interval = setInterval(() => setClock(getNepalTime()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchAdminStats()
      .then(({ data, error }) => {
        if (error) {
          setStatsError(error)
          setStats(null)
        } else if (data) {
          setStats(data)
          setStatsError(null)
        }
      })
      .finally(() => setLoadingStats(false))
  }, [])

  useEffect(() => {
    fetchUsers({ limit: 5 })
      .then(({ data, error }) => {
        if (error) {
          setUsersError(error)
          setLatestUsers([])
        } else if (data?.data) {
          setLatestUsers(
            data.data.map((u: AdminUserRecord) => ({
              id: u.id,
              full_name: u.full_name,
              role: u.role,
              timeAgo: formatRelativeTime(u.created_at),
            }))
          )
          setUsersError(null)
        }
      })
      .finally(() => setLoadingUsers(false))
  }, [])

  useEffect(() => {
    fetchAdminSosEvents({ limit: 500 })
      .then(({ data, error }) => {
        if (error) {
          setChartError(error)
          setChartData([])
        } else if (data?.data) {
          setChartData(buildSosChartData(data.data))
          setChartError(null)
        }
      })
      .finally(() => setLoadingChart(false))
  }, [])

  useEffect(() => {
    loadAdminSosAlerts()
      .then((alerts) => {
        const live = sortSosAlerts(alerts.filter((a) => a.status !== "Resolved")).slice(0, 5)
        setSosAlerts(live)
        setSosError(null)
      })
      .catch(() => {
        setSosError("Failed to load SOS alerts")
        setSosAlerts([])
      })
      .finally(() => setLoadingSos(false))
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

  const handleBroadcast = async () => {
    const message = broadcastMsg.trim()
    if (!message) {
      toast.error("Enter a broadcast message")
      return
    }
    try {
      const result = await sendAdminBroadcast({
        message,
        priority: "high",
        send_email: true,
      })
      if (result.error || !result.data) {
        toast.error(result.error ?? "Broadcast failed")
        return
      }
      toast.success(
        `Broadcast delivered to ${result.data.recipients} officers via ${result.data.delivered_via.join(", ")}`,
      )
      setBroadcastOpen(false)
      setBroadcastMsg("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Broadcast failed")
    }
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
        <StatCard
          label="Total Users"
          value={statsError ? "—" : (stats?.totalUsers ?? 0).toLocaleString()}
          icon={Users}
          loading={loadingStats}
        />
        <StatCard
          label="Active SOS"
          value={statsError ? "—" : String(stats?.activeSosEvents ?? 0)}
          icon={AlertTriangle}
          loading={loadingStats}
        />
        <StatCard
          label="Resolved Today"
          value={statsError ? "—" : String(stats?.resolvedSosToday ?? 0)}
          icon={CheckCircle}
          loading={loadingStats}
        />
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
                  {loadingSos ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? "bg-[#0A0A0A]" : ""}`}>
                        <td colSpan={6} className="px-5 py-3">
                          <Skeleton className="h-4 w-full bg-white/5" />
                        </td>
                      </tr>
                    ))
                  ) : sosError ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-sm text-[#E74C3C]">
                        <span className="inline-flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          {sosError}
                        </span>
                      </td>
                    </tr>
                  ) : sosAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-sm text-white/40">
                        No active SOS alerts
                      </td>
                    </tr>
                  ) : (
                    sosAlerts.map((row, i) => (
                      <tr
                        key={row.id}
                        className={`border-b border-white/5 transition hover:bg-white/5 ${i % 2 === 0 ? "bg-[#0A0A0A]" : ""}`}
                      >
                        <td className="px-5 py-3 font-mono-admin text-xs text-white/50">{row.timeAgo}</td>
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
                    ))
                  )}
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
            {loadingChart ? (
              <Skeleton className="h-[240px] w-full bg-white/5" />
            ) : chartError ? (
              <div className="flex h-[240px] items-center justify-center text-sm text-[#E74C3C]">
                <span className="inline-flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {chartError}
                </span>
              </div>
            ) : (
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
                    allowDecimals={false}
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
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Donut chart */}
          <div className="admin-card">
            <h2 className="mb-4 font-body text-sm font-medium text-white/90">User Breakdown</h2>
            {loadingStats ? (
              <Skeleton className="h-[220px] w-full bg-white/5" />
            ) : statsError ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-[#E74C3C]">
                <span className="inline-flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {statsError}
                </span>
              </div>
            ) : roleBreakdown.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-white/40">
                No user data
              </div>
            ) : (
              <>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={roleBreakdown}
                        dataKey="count"
                        nameKey="role"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={2}
                      >
                        {roleBreakdown.map((entry) => (
                          <Cell key={entry.role} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-center font-mono-admin text-sm text-white">
                      {(stats?.totalUsers ?? 0).toLocaleString()}
                      <br />
                      <span className="text-[10px] text-white/50">Total</span>
                    </p>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {roleBreakdown.map((r) => (
                    <div key={r.role} className="flex items-center gap-2 text-xs text-white/60">
                      <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                      {r.role.replace("_", " ")} — {r.count.toLocaleString()}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Latest users */}
          <div className="admin-card">
            <h2 className="mb-4 font-body text-sm font-medium text-white/90">Latest Registered Users</h2>
            {loadingUsers ? (
              <ul className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-white/5" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32 bg-white/5" />
                      <Skeleton className="h-3 w-16 bg-white/5" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : usersError ? (
              <div className="py-8 text-center text-sm text-[#E74C3C]">
                <span className="inline-flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {usersError}
                </span>
              </div>
            ) : latestUsers.length === 0 ? (
              <div className="py-8 text-center text-sm text-white/40">No users yet</div>
            ) : (
              <ul className="space-y-3">
                {latestUsers.map((u) => (
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
            )}
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
