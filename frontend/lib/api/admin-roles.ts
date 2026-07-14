import { adminApiRequest } from "./client"

export interface AdminRolesMatrixResponse {
  message: string
  roles: string[]
  permissions: string[]
  matrix: Record<string, boolean[]>
  entries: Array<{
    id: string
    role: string
    permission: string
    allowed: boolean
    updated_at: string
  }>
}

export function fetchAdminRolesMatrix() {
  return adminApiRequest<AdminRolesMatrixResponse>("/admin/roles")
}

export function updateAdminRolesMatrix(
  entries: Array<{ role: string; permission: string; allowed: boolean }>,
) {
  return adminApiRequest<AdminRolesMatrixResponse>("/admin/roles", {
    method: "PUT",
    body: JSON.stringify({ entries }),
  })
}
