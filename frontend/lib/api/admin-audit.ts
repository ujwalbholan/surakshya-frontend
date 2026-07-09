import { adminApiRequest } from "./client"
import type { AdminAuditDetailResponse, AdminAuditListResponse } from "./types"

export async function fetchAdminAuditLogs(options?: {
  action?: string
  actor_user_id?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}) {
  const params = new URLSearchParams()
  if (options?.action) params.set("action", options.action)
  if (options?.actor_user_id) params.set("actor_user_id", options.actor_user_id)
  if (options?.from) params.set("from", options.from)
  if (options?.to) params.set("to", options.to)
  if (options?.page) params.set("page", String(options.page))
  if (options?.limit) params.set("limit", String(options.limit))
  const qs = params.toString()
  return adminApiRequest<AdminAuditListResponse>(`/admin/audit${qs ? `?${qs}` : ""}`)
}

export async function fetchAdminAuditLog(id: string) {
  return adminApiRequest<AdminAuditDetailResponse>(`/admin/audit/${id}`)
}
