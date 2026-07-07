import type { AdminSosEventRecord, LiveEmergencyEvent } from "@/lib/api/types"
import type { AdminSosAlert, SosPriority, SosStatus } from "@/lib/admin/sos-types"

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr ago`
  return date.toLocaleDateString()
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Kathmandu",
  })
}

function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(4)}°N · ${lng.toFixed(4)}°E`
}

function derivePriority(startedAt: string, triggerNotes?: string | null): SosPriority {
  if (triggerNotes?.trim()) return "CRITICAL"
  const minutes = (Date.now() - new Date(startedAt).getTime()) / 60000
  if (minutes < 10) return "CRITICAL"
  if (minutes < 20) return "HIGH"
  if (minutes < 45) return "MEDIUM"
  return "LOW"
}

function mapActiveUiStatus(event: Pick<LiveEmergencyEvent, "assignedStationId">): SosStatus {
  return event.assignedStationId ? "Dispatched" : "Active"
}

function buildLiveTimeline(event: LiveEmergencyEvent): AdminSosAlert["timeline"] {
  const timeline: AdminSosAlert["timeline"] = [
    {
      time: formatTime(event.startedAt),
      description: `SOS ${event.eventType ?? "triggered"} on device ${event.imei}`,
    },
  ]

  const lat = event.lastLocation?.latitude ?? event.latitude
  const lng = event.lastLocation?.longitude ?? event.longitude
  if (lat != null && lng != null) {
    timeline.push({
      time: formatTime(event.lastLocation?.recordedAt ?? event.startedAt),
      description: `GPS lock acquired (${formatCoordinates(lat, lng)})`,
    })
  }

  if (event.triggerNotes?.trim()) {
    timeline.push({
      time: formatTime(event.startedAt),
      description: `Trigger note: ${event.triggerNotes.trim()}`,
    })
  }

  if (event.assignedStationName) {
    timeline.push({
      time: formatTime(event.startedAt),
      description: `Assigned to ${event.assignedStationName}`,
    })
  }

  return timeline
}

export function mapLiveEmergencyToAlert(event: LiveEmergencyEvent): AdminSosAlert {
  const lat = event.lastLocation?.latitude ?? event.latitude ?? 27.7172
  const lng = event.lastLocation?.longitude ?? event.longitude ?? 85.324
  const victim = event.user?.fullName ?? event.label ?? `Device ${event.imei}`
  const coordinates = formatCoordinates(lat, lng)

  return {
    id: event.id,
    victim,
    age: 0,
    bloodType: "—",
    phone: event.user?.phone ?? "—",
    location: coordinates,
    district: "Nepal",
    ward: event.label ?? "—",
    address: event.assignedStationName ?? coordinates,
    lat,
    lng,
    priority: derivePriority(event.startedAt, event.triggerNotes),
    status: mapActiveUiStatus(event),
    triggeredAt: event.startedAt,
    timeAgo: formatRelativeTime(event.startedAt),
    timeline: buildLiveTimeline(event),
    emergencyContacts: [],
    triggerNotes: event.triggerNotes,
    imei: event.imei,
    assignedUnit: event.assignedStationName
      ? {
          name: event.assignedStationName,
          officer: "—",
          vehicle: "—",
          status: "Assigned",
        }
      : undefined,
  }
}

export function mapLiveEmergenciesToAlerts(events: LiveEmergencyEvent[]): AdminSosAlert[] {
  return events.map(mapLiveEmergencyToAlert)
}

export function mapAdminSosEventToAlert(event: AdminSosEventRecord): AdminSosAlert {
  const lat = event.latitude ?? 27.7172
  const lng = event.longitude ?? 85.324
  const victim = event.device.label ?? `Device ${event.device.imei}`
  const coordinates = formatCoordinates(lat, lng)
  const isResolved = event.status === "resolved"

  return {
    id: event.id,
    victim,
    age: 0,
    bloodType: "—",
    phone: "—",
    location: coordinates,
    district: "Nepal",
    ward: event.device.label ?? "—",
    address: coordinates,
    lat,
    lng,
    priority: isResolved ? "LOW" : derivePriority(event.startedAt, event.triggerNotes),
    status: isResolved ? "Resolved" : "Active",
    triggeredAt: event.startedAt,
    timeAgo: formatRelativeTime(isResolved ? (event.resolvedAt ?? event.startedAt) : event.startedAt),
    timeline: [
      {
        time: formatTime(event.startedAt),
        description: `SOS ${event.eventType ?? "triggered"} on device ${event.device.imei}`,
      },
      ...(isResolved
        ? [
            {
              time: formatTime(event.resolvedAt ?? event.startedAt),
              description: event.notes?.trim()
                ? `Resolved: ${event.notes.trim()}`
                : "Marked resolved",
            },
          ]
        : []),
    ],
    emergencyContacts: [],
    triggerNotes: event.triggerNotes ?? null,
    imei: event.device.imei,
  }
}

export async function loadAdminSosAlerts(): Promise<AdminSosAlert[]> {
  const { fetchLiveEmergencies } = await import("@/lib/api/admin-live")
  const { fetchAdminSosEvents } = await import("@/lib/api/admin-sos")

  const [liveResult, resolvedResult] = await Promise.all([
    fetchLiveEmergencies(),
    fetchAdminSosEvents({ status: "resolved", limit: 100 }),
  ])

  const activeAlerts =
    liveResult.data?.data.map(mapLiveEmergencyToAlert) ?? []

  const resolvedAlerts =
    resolvedResult.data?.data
      .filter((event) => !activeAlerts.some((active) => active.id === event.id))
      .map(mapAdminSosEventToAlert) ?? []

  return [...activeAlerts, ...resolvedAlerts]
}
