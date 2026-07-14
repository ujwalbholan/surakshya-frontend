import type { PoliceSosEventSummary } from "@/lib/api/types"
import type { AlertStatus, SosAlert, VictimProfile } from "@/lib/dashboard/police-types"

const PLACEHOLDER_PHOTO = "/images/social-1.jpg"

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  const diffMs = Math.max(0, now - date.getTime())
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 45) return "Just now"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
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

/** Keep profile/contacts loaded by the detail panel across socket & poll remaps. */
export function preserveSosVictimProfile(
  existing: VictimProfile | undefined,
  incoming: VictimProfile
): VictimProfile {
  if (!existing) return incoming

  const keepContacts =
    incoming.emergencyContacts.length > 0
      ? incoming.emergencyContacts
      : existing.emergencyContacts

  const keepPhone =
    incoming.phone && incoming.phone !== "—" ? incoming.phone : existing.phone
  const keepBlood =
    incoming.bloodType && incoming.bloodType !== "—"
      ? incoming.bloodType
      : existing.bloodType
  const deviceLike =
    incoming.fullName.startsWith("Device ") ||
    incoming.fullName === existing.fullName

  return {
    ...incoming,
    fullName:
      !deviceLike && incoming.fullName ? incoming.fullName : existing.fullName,
    phone: keepPhone,
    bloodType: keepBlood,
    age: incoming.age > 0 ? incoming.age : existing.age,
    emergencyContacts: keepContacts,
    photoUrl: incoming.photoUrl || existing.photoUrl,
  }
}

export function mergeSosAlertState(
  existing: SosAlert | undefined,
  incoming: SosAlert
): SosAlert {
  if (!existing || existing.id !== incoming.id) return incoming

  const incomingIsDeviceFallback = incoming.citizen.startsWith("Device ")

  return {
    ...incoming,
    userId: incoming.userId ?? existing.userId,
    citizen: incomingIsDeviceFallback ? existing.citizen : incoming.citizen,
    startedAtIso: incoming.startedAtIso || existing.startedAtIso,
    victim: preserveSosVictimProfile(existing.victim, incoming.victim),
    liveLocation: {
      ...incoming.liveLocation,
      address:
        incoming.liveLocation.address === "Live GPS coordinates" ||
        incoming.liveLocation.address === existing.ward ||
        incoming.liveLocation.address.startsWith("Device ")
          ? existing.liveLocation.address || incoming.liveLocation.address
          : incoming.liveLocation.address,
    },
  }
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
    startedAtIso: event.startedAt,
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
      address: "Live GPS coordinates",
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
