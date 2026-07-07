import type { AdminSosAlert, SosPriority } from "@/lib/admin/sos-types"

export const NEPAL_MAP_CENTER = {
  lat: 28.3949,
  lng: 84.124,
  zoom: 7,
} as const

export const DARK_MAP_TILES =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"

export const DARK_MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

export function getLiveMapAlerts(alerts: AdminSosAlert[]) {
  return alerts.filter((alert) => alert.status !== "Resolved")
}

export function getActiveFeedAlerts(alerts: AdminSosAlert[]) {
  return alerts.filter((alert) => alert.status === "Active")
}

export function priorityMarkerColor(priority: SosPriority) {
  switch (priority) {
    case "CRITICAL":
      return "#C0392B"
    case "HIGH":
      return "#f97316"
    case "MEDIUM":
      return "#eab308"
    default:
      return "#737373"
  }
}

export function getLiveSummary(alerts: AdminSosAlert[]) {
  const live = getLiveMapAlerts(alerts)
  return {
    active: alerts.filter((a) => a.status === "Active").length,
    dispatched: alerts.filter((a) => a.status === "Dispatched").length,
    onMap: live.length,
    critical: live.filter((a) => a.priority === "CRITICAL").length,
  }
}
