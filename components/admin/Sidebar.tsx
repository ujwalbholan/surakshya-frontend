"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  Radio,
  Users,
  ShieldCheck,
  UserPlus,
  AlertTriangle,
  FolderOpen,
  Lock,
  MapPin,
  Send,
  BarChart3,
  Activity,
  Settings,
  ScrollText,
  Key,
  LogOut,
  ChevronDown,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import SurakshaShieldLogo from "@/components/admin/SurakshaShieldLogo"
import { getAdminSession, clearAdminSession } from "@/lib/auth/admin-session"
import { adminLogout } from "@/lib/api/admin-auth"
import { MOCK_SOS_ALERTS } from "@/lib/admin/mock-data"
import { useInterval } from "@/hooks/use-interval"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: React.ReactNode
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      {
        label: "Live Command",
        href: "/admin/live",
        icon: Radio,
        badge: <span className="admin-live-dot ml-auto h-1.5 w-1.5 rounded-full bg-[#C0392B]" />,
      },
    ],
  },
  {
    title: "User Management",
    items: [
      { label: "All Users", href: "/admin/users", icon: Users },
      { label: "Roles & Permissions", href: "/admin/roles", icon: ShieldCheck },
      { label: "Add User", href: "/admin/users/new", icon: UserPlus },
    ],
  },
  {
    title: "SOS & Incidents",
    items: [
      { label: "SOS Alerts", href: "/admin/sos", icon: AlertTriangle },
      { label: "Incident Cases", href: "/admin/cases", icon: FolderOpen },
      { label: "Evidence Vault", href: "/admin/evidence", icon: Lock },
    ],
  },
  {
    title: "Field Operations",
    items: [
      { label: "Field Units", href: "/admin/units", icon: MapPin },
      { label: "Dispatch Log", href: "/admin/dispatch", icon: Send },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
      { label: "System Health", href: "/admin/health", icon: Activity },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Audit Log", href: "/admin/audit", icon: ScrollText },
      { label: "API Keys", href: "/admin/api-keys", icon: Key },
    ],
  },
]

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const session = getAdminSession()
  const [sosCount, setSosCount] = useState<number | null>(null)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(NAV_GROUPS.map((g) => [g.title, true]))
  )

  useEffect(() => {
    const active = MOCK_SOS_ALERTS.filter((a) => a.status === "Active").length
    setSosCount(active)
  }, [])

  useInterval(() => {
    const active = MOCK_SOS_ALERTS.filter((a) => a.status === "Active").length
    setSosCount(active)
  }, 30000)

  const handleLogout = async () => {
    await adminLogout()
    clearAdminSession()
    router.push("/admin/login")
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/5 px-4 py-5">
        <div className="flex items-center gap-2.5">
          <SurakshaShieldLogo size={28} />
          <span className="font-mono-admin text-xs tracking-widest text-white uppercase">Suraksha</span>
        </div>
        <span className="mt-2 inline-block rounded-full bg-[#C0392B] px-2 py-0.5 font-mono-admin text-[10px] text-white uppercase">
          Super Admin
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_GROUPS.map((group) => (
          <Collapsible
            key={group.title}
            open={openGroups[group.title]}
            onOpenChange={(open) => setOpenGroups((prev) => ({ ...prev, [group.title]: open }))}
            className="mb-1"
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 font-mono-admin text-[10px] tracking-widest text-white/30 uppercase hover:text-white/50">
              {group.title}
              <ChevronDown className={cn("h-3 w-3 transition-transform", openGroups[group.title] && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="space-y-0.5 pb-2">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                  const isSos = item.href === "/admin/sos"
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "border-l-[3px] border-[#C0392B] bg-[#C0392B]/10 pl-[9px] text-white"
                            : "border-l-[3px] border-transparent text-white/50 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {isSos && (
                          <span className="rounded-full bg-[#C0392B] px-1.5 py-0.5 font-mono-admin text-[10px] text-white">
                            {sosCount ?? "-"}
                          </span>
                        )}
                        {item.badge}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </nav>

      <div className="border-t border-white/5 p-4">
        {session && (
          <>
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-white">{session.full_name}</p>
              <span className="shrink-0 rounded-full bg-[#C0392B]/20 px-1.5 py-0.5 font-mono-admin text-[9px] text-[#C0392B]">
                {session.role}
              </span>
            </div>
            <p className="mt-0.5 truncate font-mono-admin text-[11px] text-white/40">{session.email}</p>
          </>
        )}
        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/50 transition hover:bg-[#C0392B]/10 hover:text-[#C0392B]"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-white/5 bg-[#0A0A0A] lg:flex">
        <NavContent />
      </aside>

      {/* Mobile trigger */}
      <div className="fixed top-0 left-0 z-40 flex h-14 items-center border-b border-white/5 bg-[#0A0A0A] px-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="text-white/70 hover:text-white" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] border-white/5 bg-[#0A0A0A] p-0">
            <NavContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="ml-3 flex items-center gap-2">
          <SurakshaShieldLogo size={22} />
          <span className="font-mono-admin text-[10px] tracking-widest text-white uppercase">Suraksha</span>
        </div>
      </div>
    </>
  )
}
