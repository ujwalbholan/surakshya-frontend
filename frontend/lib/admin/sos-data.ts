import type { MockSosAlert, SosPriority, SosStatus } from "@/lib/admin/mock-data"

const PRIORITY_ORDER: Record<SosPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
}

const STATUS_ORDER: Record<SosStatus, number> = {
  Active: 0,
  Dispatched: 1,
  Resolved: 2,
}

export type SosStatusFilter = SosStatus | "all"

export function sortSosAlerts(alerts: MockSosAlert[]): MockSosAlert[] {
  return [...alerts].sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (statusDiff !== 0) return statusDiff
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  })
}

export function filterSosAlerts(
  alerts: MockSosAlert[],
  search: string,
  status: SosStatusFilter
): MockSosAlert[] {
  const q = search.toLowerCase().trim()
  return alerts.filter((alert) => {
    const matchSearch =
      !q ||
      alert.id.toLowerCase().includes(q) ||
      alert.victim.toLowerCase().includes(q) ||
      alert.location.toLowerCase().includes(q) ||
      alert.district.toLowerCase().includes(q)
    const matchStatus = status === "all" || alert.status === status
    return matchSearch && matchStatus
  })
}

export function getSosSummary(alerts: MockSosAlert[]) {
  return {
    active: alerts.filter((a) => a.status === "Active").length,
    dispatched: alerts.filter((a) => a.status === "Dispatched").length,
    resolved: alerts.filter((a) => a.status === "Resolved").length,
    critical: alerts.filter((a) => a.priority === "CRITICAL" && a.status !== "Resolved").length,
  }
}

export function mapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`
}
