import type { PoliceSosEventSummary } from "@/lib/api/types"
import type { AlertStatus, SosAlert } from "@/lib/dashboard/police-types"

const PLACEHOLDER_PHOTO = "/images/social-1.jpg"

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

function formatCoordinates(lat?: number | null, lng?: number | null): string {
  if (lat == null || lng == null) return "Coordinates unavailable"
  return `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`
}

function mapStatus(status: string): AlertStatus {
  if (status === "resolved") return "resolved"
  if (status === "responding") return "responding"
  return "critical"
}

export function mapSosEventToAlert(
  event: PoliceSosEventSummary,
  citizenName?: string
): SosAlert {
  const lat =
    event.lastLocation?.latitude ?? event.latitude ?? 27.7172
  const lng =
    event.lastLocation?.longitude ?? event.longitude ?? 85.324
  const name = citizenName ?? event.label ?? `Device ${event.imei}`

  return {
    id: event.id,
    citizen: name,
    district: "Nepal",
    ward: event.label ?? "—",
    location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    coordinates: formatCoordinates(lat, lng),
    triggeredAt: formatRelativeTime(event.startedAt),
    status: mapStatus(event.status),
    priority: "high",
    triggerType: "double_tap",
    victim: {
      fullName: name,
      age: 0,
      phone: "—",
      bloodType: "—",
      photoUrl: PLACEHOLDER_PHOTO,
      emergencyContacts: [],
    },
    liveLocation: {
      lat,
      lng,
      address: event.label ?? "Live GPS coordinates",
      lastUpdated: event.lastLocation
        ? formatRelativeTime(event.lastLocation.recordedAt)
        : "Unknown",
      accuracyMeters: 10,
    },
    deviceId: event.deviceId,
    userId: event.userId ?? undefined,
  }
}

export type { SosAlert }
