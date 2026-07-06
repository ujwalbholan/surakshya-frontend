"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Bell, LayoutDashboard, LogOut } from "lucide-react"
import IncomingSosModal from "@/components/dashboard/IncomingSosModal"
import CasesView from "@/components/dashboard/views/CasesView"
import DashboardOverviewView from "@/components/dashboard/views/DashboardOverviewView"
import ReportsView from "@/components/dashboard/views/ReportsView"
import SettingsView from "@/components/dashboard/views/SettingsView"
import SosAlertsView from "@/components/dashboard/views/SosAlertsView"
import UnitsView from "@/components/dashboard/views/UnitsView"
import { Badge } from "@/components/ui/badge"
import { logoutUser } from "@/lib/api/auth"
import { clearAuthSession, getStoredEmail } from "@/lib/auth/session"
import { NAV_ITEMS, VIEW_TITLES, type DashboardView } from "@/lib/dashboard/nav"
import { sosAlerts } from "@/lib/dashboard/mock-data"
import { cn } from "@/lib/utils"

function formatNepalTime(date: Date) {
  return date.toLocaleString("en-NP", {
    timeZone: "Asia/Kathmandu",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

function NavButtons({
  activeView,
  criticalCount,
  onNav,
  onNavigate,
}: {
  activeView: DashboardView
  criticalCount: number
  onNav: (view: DashboardView) => void
  onNavigate?: () => void
}) {
  return (
    <>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            onNav(item.id)
            onNavigate?.()
          }}
          className={cn(
            "mb-1 flex w-full items-center justify-between gap-2 rounded px-3 py-2.5 text-left text-xs uppercase tracking-wider transition-colors",
            activeView === item.id
              ? "bg-[#C0392B]/15 text-[#FAFAFA]"
              : "text-[#666] hover:bg-[#1a1a1a] hover:text-[#FAFAFA]"
          )}
        >
          <span className="flex items-center gap-3">
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </span>
          {(item.id === "sos" ? criticalCount : item.badge) !== undefined &&
            (item.id === "sos" ? criticalCount > 0 : true) && (
            <span className="font-mono text-[9px] text-[#888]">
              {item.id === "sos" ? criticalCount : item.badge}
            </span>
          )}
        </button>
      ))}
    </>
  )
}

export default function PoliceDashboard() {
  const router = useRouter()
  const [email] = useState(() => getStoredEmail())
  const [nepalTime, setNepalTime] = useState(() => formatNepalTime(new Date()))
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState<DashboardView>("dashboard")
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(
    () => sosAlerts.find((a) => a.status === "critical")?.id ?? null
  )
  const [showIncomingModal, setShowIncomingModal] = useState(false)

  const defaultCritical = sosAlerts.find((a) => a.status === "critical")
  const selectedAlert = useMemo(
    () =>
      sosAlerts.find((a) => a.id === selectedAlertId) ??
      defaultCritical ??
      sosAlerts[0],
    [selectedAlertId, defaultCritical]
  )

  const criticalCount = sosAlerts.filter((a) => a.status === "critical").length
  const viewMeta = VIEW_TITLES[activeView]

  useEffect(() => {
    if (!defaultCritical || activeView !== "dashboard") return
    const timer = setTimeout(() => setShowIncomingModal(true), 1200)
    return () => clearTimeout(timer)
  }, [defaultCritical, activeView])

  useEffect(() => {
    const id = setInterval(() => {
      setNepalTime(formatNepalTime(new Date()))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const handleSelectAlert = useCallback((id: string) => {
    setSelectedAlertId(id)
    setShowIncomingModal(false)
    setActiveView("sos")
  }, [])

  const handleNav = (view: DashboardView) => {
    setActiveView(view)
    setSidebarOpen(false)
    if (view === "sos" && defaultCritical) {
      setSelectedAlertId(defaultCritical.id)
    }
  }

  const handleLogout = async () => {
    await logoutUser()
    clearAuthSession()
    router.push("/login")
  }

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <DashboardOverviewView
            selectedAlert={selectedAlert}
            onSelectAlert={handleSelectAlert}
            criticalCount={criticalCount}
            defaultCritical={defaultCritical}
          />
        )
      case "sos":
        return (
          <SosAlertsView
            selectedAlert={selectedAlert}
            onSelectAlert={(id) => setSelectedAlertId(id)}
          />
        )
      case "cases":
        return <CasesView />
      case "units":
        return <UnitsView />
      case "reports":
        return <ReportsView />
      case "settings":
        return <SettingsView />
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-[#080808] text-[#FAFAFA]">
      {showIncomingModal && defaultCritical && activeView === "dashboard" && (
        <IncomingSosModal
          alert={defaultCritical}
          onView={() => handleSelectAlert(defaultCritical.id)}
          onDismiss={() => setShowIncomingModal(false)}
        />
      )}

      <aside className="hidden w-56 shrink-0 flex-col border-r border-[#222] bg-[#050505] lg:flex">
        <div className="border-b border-[#222] px-5 py-6">
          <Link href="/" className="font-serif text-lg italic text-[#FAFAFA]">
            Suraksha
          </Link>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#C0392B]">
            Nepal Police Ops
          </p>
          <p className="mt-0.5 text-[10px] text-[#555]">सुरक्षा नेटवर्क</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <NavButtons
            activeView={activeView}
            criticalCount={criticalCount}
            onNav={handleNav}
          />
        </nav>
        <div className="border-t border-[#222] p-4">
          <div className="flex items-center gap-2 text-[10px] text-emerald-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            System online
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-[#222] bg-[#0a0a0a]/95 px-4 py-3 backdrop-blur-md lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded border border-[#333] p-2 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <LayoutDashboard className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-tight lg:text-base">
                {viewMeta.title}
              </h1>
              <p className="truncate font-mono text-[10px] text-[#666]">
                {viewMeta.subtitle} · <span className="text-[#C0392B]">{nepalTime} NPT</span>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {criticalCount > 0 && (
              <button
                type="button"
                onClick={() => handleNav("sos")}
                className="hidden sm:block"
              >
                <Badge className="animate-pulse border-[#C0392B] bg-[#C0392B]/20 text-[#E74C3C]">
                  <Bell className="h-3 w-3" />
                  {criticalCount} critical
                </Badge>
              </button>
            )}
            <div className="hidden text-right sm:block">
              <p className="text-xs text-[#FAFAFA]">{email ?? "Officer"}</p>
              <p className="font-mono text-[9px] uppercase tracking-wider text-[#666]">
                Nepal Police · Authorized
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded border border-[#333] px-3 py-2 text-[10px] uppercase tracking-wider text-[#888] transition-colors hover:border-[#C0392B] hover:text-[#FAFAFA]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => setSidebarOpen(false)}
              aria-hidden
            />
            <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-[#050505] border-r border-[#222]">
              <div className="border-b border-[#222] px-5 py-5">
                <p className="font-serif text-lg italic">Suraksha</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C0392B]">
                  Nepal Police Ops
                </p>
              </div>
              <nav className="flex-1 overflow-y-auto p-3">
                <NavButtons
                  activeView={activeView}
                  criticalCount={criticalCount}
                  onNav={handleNav}
                  onNavigate={() => setSidebarOpen(false)}
                />
              </nav>
            </aside>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{renderView()}</main>
      </div>
    </div>
  )
}
