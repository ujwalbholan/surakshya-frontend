import { adminApiRequest } from "./client"
import type {
  AdminEvidenceDetailResponse,
  AdminEvidenceListResponse,
  CreateEvidencePayload,
} from "./types"

export async function fetchAdminEvidence(options?: {
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
  return adminApiRequest<AdminEvidenceListResponse>(`/admin/evidence${qs ? `?${qs}` : ""}`)
}

export async function fetchAdminEvidenceItem(id: string) {
  return adminApiRequest<AdminEvidenceDetailResponse>(`/admin/evidence/${id}`)
}

export async function createAdminEvidence(payload: CreateEvidencePayload) {
  return adminApiRequest<AdminEvidenceDetailResponse>("/admin/evidence", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
