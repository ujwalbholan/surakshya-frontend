import { adminApiRequest } from "./client"

export interface AdminBroadcastPayload {
  message: string
  priority?: "normal" | "high"
  station_id?: string
  send_email?: boolean
}

export interface AdminBroadcastResponse {
  id: string
  message: string
  priority: string
  station_id: string | null
  recipients: number
  emails_queued: number
  delivered_via: string[]
  created_at: string
}

export function sendAdminBroadcast(payload: AdminBroadcastPayload) {
  return adminApiRequest<AdminBroadcastResponse>("/admin/broadcast", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
