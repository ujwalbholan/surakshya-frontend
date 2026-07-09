import { adminApiRequest } from "./client"
import type {
  AdminCaseDetailResponse,
  AdminCaseNoteResponse,
  AdminCasesListResponse,
  AdminCaseStatusResponse,
  CreateCasePayload,
  UpdateCasePayload,
} from "./types"

export async function fetchAdminCases(options?: {
  status?: string
  priority?: string
  station_id?: string
  province?: string
  page?: number
  limit?: number
}) {
  const params = new URLSearchParams()
  if (options?.status) params.set("status", options.status)
  if (options?.priority) params.set("priority", options.priority)
  if (options?.station_id) params.set("station_id", options.station_id)
  if (options?.province) params.set("province", options.province)
  if (options?.page) params.set("page", String(options.page))
  if (options?.limit) params.set("limit", String(options.limit))
  const qs = params.toString()
  return adminApiRequest<AdminCasesListResponse>(`/admin/cases${qs ? `?${qs}` : ""}`)
}

export async function fetchAdminCase(id: string) {
  return adminApiRequest<AdminCaseDetailResponse>(`/admin/cases/${id}`)
}

export async function createAdminCase(payload: CreateCasePayload) {
  return adminApiRequest<AdminCaseDetailResponse>("/admin/cases", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateAdminCase(id: string, payload: UpdateCasePayload) {
  return adminApiRequest<AdminCaseDetailResponse>(`/admin/cases/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export async function updateAdminCaseStatus(id: string, status: string) {
  return adminApiRequest<AdminCaseStatusResponse>(`/admin/cases/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export async function addAdminCaseNote(id: string, body: string) {
  return adminApiRequest<AdminCaseNoteResponse>(`/admin/cases/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ body }),
  })
}
