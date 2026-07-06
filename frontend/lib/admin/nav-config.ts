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
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface AdminNavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: "live" | "sos-count"
}

export interface AdminNavGroup {
  title: string
  items: AdminNavItem[]
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Live Command", href: "/admin/live", icon: Radio, badge: "live" },
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
      { label: "SOS Alerts", href: "/admin/sos", icon: AlertTriangle, badge: "sos-count" },
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

export function isAdminNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  return pathname === href || pathname.startsWith(href + "/")
}
