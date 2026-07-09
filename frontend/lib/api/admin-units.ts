import { adminApiRequest } from "./client"
import type {
  AdminPatrolUnitResponse,
  AdminPatrolUnitsListResponse,
  CreatePatrolUnitPayload,
  UpdatePatrolUnitPayload,
} from "./types"

export async function fetchAdminUnits(options?: {
  status?: string
  station_id?: string
  province?: string
  page?: number
  limit?: number
}) {
  const params = new URLSearchParams()
  if (options?.status) params.set("status", options.status)
  if (options?.station_id) params.set("station_id", options.station_id)
  if (options?.province) params.set("province", options.province)
  if (options?.page) params.set("page", String(options.page))
  if (options?.limit) params.set("limit", String(options.limit))
  const qs = params.toString()
  return adminApiRequest<AdminPatrolUnitsListResponse>(`/admin/units${qs ? `?${qs}` : ""}`)
}

export async function createAdminUnit(payload: CreatePatrolUnitPayload) {
  return adminApiRequest<AdminPatrolUnitResponse>("/admin/units", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateAdminUnit(id: string, payload: UpdatePatrolUnitPayload) {
  return adminApiRequest<AdminPatrolUnitResponse>(`/admin/units/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}
