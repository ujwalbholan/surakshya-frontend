import { adminApiRequest } from "./client"

export interface AdminDeviceUser {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
}

export interface AdminDeviceRecord {
  id: string
  imei: string
  label: string | null
  isOnline: boolean
  lastSeenAt: string | null
  user: AdminDeviceUser | null
}

export interface AdminDevicesListResponse {
  data: AdminDeviceRecord[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function fetchAdminDevices(params?: { page?: number; limit?: number }) {
  const query = new URLSearchParams()
  if (params?.page) query.set("page", String(params.page))
  query.set("limit", String(params?.limit ?? 100))
  const qs = query.toString()
  return adminApiRequest<AdminDevicesListResponse>(`/admin/devices?${qs}`)
}

export function createAdminDevice(payload: { imei: string; label?: string }) {
  return adminApiRequest<AdminDeviceRecord>("/admin/devices", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function assignDevice(deviceId: string, userId: string) {
  return adminApiRequest<AdminDeviceRecord>(`/admin/devices/${deviceId}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ userId }),
  })
}

export function unassignDevice(deviceId: string) {
  return adminApiRequest<AdminDeviceRecord>(`/admin/devices/${deviceId}/unassign`, {
    method: "PATCH",
  })
}
