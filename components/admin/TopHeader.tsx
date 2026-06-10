"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Search } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getAdminSession, clearAdminSession } from "@/lib/auth/admin-session"
import { getInitials } from "@/lib/admin/mock-data"
import { adminLogout } from "@/lib/api/admin-auth"

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  users: "User Management",
  new: "Add User",
  sos: "SOS Alerts",
  cases: "Incident Cases",
  evidence: "Evidence Vault",
  units: "Field Units",
  dispatch: "Dispatch Log",
  reports: "Reports",
  health: "System Health",
  settings: "Settings",
  audit: "Audit Log",
  "api-keys": "API Keys",
  live: "Live Command",
  roles: "Roles & Permissions",
}

export default function TopHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const session = getAdminSession()

  const segments = pathname?.replace("/admin/", "").split("/").filter(Boolean) ?? []

  const handleSignOut = async () => {
    await adminLogout()
    clearAdminSession()
    router.push("/admin/login")
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-[#0A0A0A]/95 px-4 backdrop-blur-md lg:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/dashboard" className="text-white/40 hover:text-white/70">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {segments.map((seg, i) => {
            const isLast = i === segments.length - 1
            const href = `/admin/${segments.slice(0, i + 1).join("/")}`
            const label = ROUTE_LABELS[seg] ?? seg
            return (
              <span key={seg + i} className="flex items-center gap-1.5">
                <BreadcrumbSeparator className="text-white/15" />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="text-white/90">{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={href} className="text-white/40 hover:text-white/70">{label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-3">
        <button className="text-white/40 transition hover:text-white/70" aria-label="Search">
          <Search className="h-4 w-4" />
        </button>
        <button className="relative text-white/40 transition hover:text-white/70" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/10 bg-white/10 font-mono-admin text-[8px] text-white/70">
            3
          </span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/20">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="border border-white/10 bg-white/5 text-xs text-white/70">
                  {session ? getInitials(session.full_name) : "SA"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-white/10 bg-[#0A0A0A] text-white">
            <DropdownMenuItem asChild>
              <Link href="/admin/settings">My Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings">System Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={handleSignOut} className="text-white/60 focus:text-white">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
