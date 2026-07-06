import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  FileText,
  LayoutDashboard,
  Radio,
  Settings,
  Users,
} from "lucide-react"

export type DashboardView =
  | "dashboard"
  | "sos"
  | "cases"
  | "units"
  | "reports"
  | "settings"

export interface NavItem {
  id: DashboardView
  label: string
  icon: LucideIcon
  badge?: number
}

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "sos", label: "SOS Alerts", icon: AlertTriangle, badge: 7 },
  { id: "cases", label: "Cases", icon: FileText, badge: 34 },
  { id: "units", label: "Units", icon: Users },
  { id: "reports", label: "Reports", icon: Radio },
  { id: "settings", label: "Settings", icon: Settings },
]

export const VIEW_TITLES: Record<DashboardView, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Command Overview",
    subtitle: "Real-time Suraksha wristband network — Nepal-wide",
  },
  sos: {
    title: "SOS Alert Centre",
    subtitle: "Double-tap wristband signals · live victim profiles & dispatch",
  },
  cases: {
    title: "Case Management",
    subtitle: "Investigations, evidence logs & resolution tracking",
  },
  units: {
    title: "Field Units",
    subtitle: "Deployed officers, vehicles & response readiness",
  },
  reports: {
    title: "Reports & Analytics",
    subtitle: "Operational metrics, exports & provincial breakdown",
  },
  settings: {
    title: "Settings",
    subtitle: "Officer profile, alerts & system configuration",
  },
}
