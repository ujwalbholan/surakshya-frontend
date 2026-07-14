import { adminApiRequest } from "./client"

export interface AdminApiKey {
  id: string
  name: string
  prefix: string
  created_by_id?: string | null
  created_by?: {
    id: string
    full_name: string
    email: string
  } | null
  last_used_at?: string | null
  revoked_at?: string | null
  created_at: string
  updated_at: string
}

export interface AdminApiKeysListResponse {
  message: string
  api_keys: AdminApiKey[]
  total: number
}

export interface CreateAdminApiKeyResponse {
  message: string
  api_key: AdminApiKey
  secret: string
}

export function fetchAdminApiKeys() {
  return adminApiRequest<AdminApiKeysListResponse>("/admin/api-keys")
}

export function createAdminApiKey(name: string) {
  return adminApiRequest<CreateAdminApiKeyResponse>("/admin/api-keys", {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

export function revokeAdminApiKey(id: string) {
  return adminApiRequest<{ message: string; api_key: AdminApiKey }>(
    `/admin/api-keys/${id}/revoke`,
    { method: "POST" },
  )
}
