import { API_BASE } from "./client"
import { getAccessToken } from "@/lib/auth/session"
import type {
  PoliceDashboardResponse,
  PoliceDeviceLocationResponse,
  PoliceGuardian,
  PoliceSosEventsResponse,
  PoliceUserInfo,
} from "./types"

function authHeaders(): HeadersInit {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function policeRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
      ...options.headers,
    },
  })
  const text = await response.text()
  const body = text ? (JSON.parse(text) as T & { message?: string }) : null
  if (!response.ok) {
    throw new Error(body?.message ?? response.statusText ?? "Request failed")
  }
  if (body === null) {
    throw new Error("Invalid response from server")
  }
  return body as T
}

export function fetchPoliceDashboard() {
  return policeRequest<PoliceDashboardResponse>("/police/dashboard")
}

export function fetchActiveSosEvents() {
  return policeRequest<PoliceSosEventsResponse>("/police/sos-events")
}

export function fetchSosEventDetails(id: string) {
  return policeRequest<Record<string, unknown>>(`/police/sos-events/${id}`)
}

export function resolveSosEvent(id: string, notes?: string) {
  return policeRequest<Record<string, unknown>>(`/police/sos-events/${id}/resolve`, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  })
}

export function fetchDeviceLocation(deviceId: string) {
  return policeRequest<PoliceDeviceLocationResponse>(
    `/police/devices/${deviceId}/location`
  )
}

export function fetchUserInfo(userId: string) {
  return policeRequest<PoliceUserInfo>(`/police/users/${userId}`)
}

export function fetchUserGuardians(userId: string) {
  return policeRequest<{ guardians: PoliceGuardian[] }>(
    `/police/users/${userId}/guardians`
  )
}
