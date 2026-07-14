import { adminApiRequest } from "./client"

export interface AdminDispatchEvent {
  id: string
  time: string
  unit: string
  case: string
  officer: string
  action: string
  unit_id?: string | null
  case_id?: string | null
  officer_id?: string | null
  created_at: string
}

export interface AdminDispatchListResponse {
  message: string
  events: AdminDispatchEvent[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function fetchAdminDispatch(options?: { page?: number; limit?: number }) {
  const params = new URLSearchParams()
  if (options?.page) params.set("page", String(options.page))
  if (options?.limit) params.set("limit", String(options.limit))
  const qs = params.toString()
  return adminApiRequest<AdminDispatchListResponse>(
    `/admin/dispatch${qs ? `?${qs}` : ""}`,
  )
}
