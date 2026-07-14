"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { LogOut, ChevronDown, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import SurakshyaShieldLogo from "@/components/admin/SurakshyaShieldLogo"
import AdminSessionSidebar from "@/components/admin/AdminSessionSidebar"
import { getAdminSession, clearAdminSession } from "@/lib/auth/admin-session"
import { adminLogout } from "@/lib/api/admin-auth"
import { fetchActiveSosCount } from "@/lib/api/admin-live"
import { getVisibleAdminNavGroups, isAdminNavActive } from "@/lib/admin/nav-config"
import { useInterval } from "@/hooks/use-interval"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

function MobileNavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const session = getAdminSession()
  const navGroups = getVisibleAdminNavGroups(session?.role)
  const [sosCount, setSosCount] = useState(0)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(navGroups.map((g) => [g.title, true]))
  )

  useEffect(() => {
    void fetchActiveSosCount().then(({ count }) => setSosCount(count))
  }, [])

  useInterval(() => {
    void fetchActiveSosCount().then(({ count }) => setSosCount(count))
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
          <SurakshyaShieldLogo size={28} variant="mono" />
          <span className="font-body text-sm font-medium tracking-wide text-white">Surakshya</span>
        </div>
        <span className="mt-2 inline-block rounded border border-white/10 px-2 py-0.5 font-mono-admin text-[10px] text-white/50 uppercase">
          Super Admin
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navGroups.map((group) => (
          <Collapsible
            key={group.title}
            open={openGroups[group.title]}
            onOpenChange={(open) => setOpenGroups((prev) => ({ ...prev, [group.title]: open }))}
            className="mb-1"
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 font-mono-admin text-[10px] tracking-widest text-white/25 uppercase hover:text-white/40">
              {group.title}
              <ChevronDown
                className={cn("h-3 w-3 transition-transform", openGroups[group.title] && "rotate-180")}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="space-y-0.5 pb-2">
                {group.items.map((item) => {
                  const isActive = isAdminNavActive(pathname, item.href)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-white/8 text-white"
                            : "text-white/45 hover:bg-white/5 hover:text-white/80"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge === "sos-count" && (
                          <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono-admin text-[10px] text-white/60">
                            {sosCount ?? "-"}
                          </span>
                        )}
                        {item.badge === "live" && (
                          <span className="admin-live-dot ml-auto h-1.5 w-1.5 rounded-full bg-white/50" />
                        )}
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
              <span className="shrink-0 rounded border border-white/10 px-1.5 py-0.5 font-mono-admin text-[9px] text-white/40">
                {session.role}
              </span>
            </div>
            <p className="mt-0.5 truncate font-mono-admin text-[11px] text-white/35">{session.email}</p>
          </>
        )}
        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/45 transition hover:bg-white/5 hover:text-white"
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
      <AdminSessionSidebar />

      <div className="fixed top-0 left-0 z-40 flex h-14 w-full items-center border-b border-white/5 bg-[#0A0A0A] px-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="text-white/70 hover:text-white" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] border-white/5 bg-[#0A0A0A] p-0">
            <MobileNavContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="ml-3 flex items-center gap-2">
          <SurakshyaShieldLogo size={22} variant="mono" />
          <span className="font-body text-sm font-medium text-white">Surakshya</span>
        </div>
      </div>
    </>
  )
}
