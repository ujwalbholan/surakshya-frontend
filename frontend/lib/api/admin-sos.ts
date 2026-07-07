import { adminApiRequest } from "./client"
import type { AdminSosEventRecord, AdminSosEventsResponse } from "./types"

export async function fetchAdminSosEvents(options?: {
  status?: "active" | "resolved"
  page?: number
  limit?: number
}) {
  const params = new URLSearchParams()
  if (options?.status) params.set("status", options.status)
  if (options?.page) params.set("page", String(options.page))
  if (options?.limit) params.set("limit", String(options.limit))
  const qs = params.toString()
  return adminApiRequest<AdminSosEventsResponse>(
    `/admin/sos-events${qs ? `?${qs}` : ""}`
  )
}

export async function fetchAdminSosEventDetails(id: string) {
  return adminApiRequest<AdminSosEventRecord & { locationPings?: unknown[] }>(
    `/admin/sos-events/${id}`
  )
}

export async function resolveAdminSosEvent(id: string) {
  return adminApiRequest<AdminSosEventRecord>(`/admin/sos-events/${id}/resolve`, {
    method: "PATCH",
  })
}
