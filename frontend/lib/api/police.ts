import { API_BASE } from "./client"
import { getAccessToken } from "@/lib/auth/session"
import type {
  PoliceCaseDetailResponse,
  PoliceCasesListResponse,
  PoliceDashboardResponse,
  PoliceDeviceLocationResponse,
  PoliceEvidenceListResponse,
  PoliceGuardian,
  PolicePatrolUnitsListResponse,
  PoliceReportSummaryResponse,
  PoliceSosEventsResponse,
  PoliceUserInfo,
  ApiReportRange,
  UpdateCasePayload,
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

export function fetchPoliceCases(options?: {
  status?: string
  priority?: string
  page?: number
  limit?: number
}) {
  const params = new URLSearchParams()
  if (options?.status) params.set("status", options.status)
  if (options?.priority) params.set("priority", options.priority)
  if (options?.page) params.set("page", String(options.page))
  if (options?.limit) params.set("limit", String(options.limit))
  const qs = params.toString()
  return policeRequest<PoliceCasesListResponse>(`/police/cases${qs ? `?${qs}` : ""}`)
}

export function fetchPoliceCase(id: string) {
  return policeRequest<PoliceCaseDetailResponse>(`/police/cases/${id}`)
}

export function updatePoliceCase(id: string, payload: UpdateCasePayload) {
  return policeRequest<PoliceCaseDetailResponse>(`/police/cases/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function fetchPoliceUnits(options?: { status?: string }) {
  const params = new URLSearchParams()
  if (options?.status) params.set("status", options.status)
  const qs = params.toString()
  return policeRequest<PolicePatrolUnitsListResponse>(`/police/units${qs ? `?${qs}` : ""}`)
}

export function fetchPoliceEvidence(options?: {
  case_id?: string
  file_type?: string
  page?: number
  limit?: number
}) {
  const params = new URLSearchParams()
  if (options?.case_id) params.set("case_id", options.case_id)
  if (options?.file_type) params.set("file_type", options.file_type)
  if (options?.page) params.set("page", String(options.page))
  if (options?.limit) params.set("limit", String(options.limit))
  const qs = params.toString()
  return policeRequest<PoliceEvidenceListResponse>(`/police/evidence${qs ? `?${qs}` : ""}`)
}

export function fetchPoliceReportSummary(range?: ApiReportRange) {
  const qs = range ? `?range=${range}` : ""
  return policeRequest<PoliceReportSummaryResponse>(`/police/reports/summary${qs}`)
}
