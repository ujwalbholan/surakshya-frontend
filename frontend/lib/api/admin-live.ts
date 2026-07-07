import { adminApiRequest } from "./client"
import type { EmergencyLiveResponse } from "./types"

export async function fetchLiveEmergencies() {
  return adminApiRequest<EmergencyLiveResponse>("/emergency/live")
}

export async function fetchActiveSosCount() {
  const result = await fetchLiveEmergencies()
  if (result.error || !result.data) {
    return { count: 0, error: result.error }
  }
  return { count: result.data.total, error: null }
}
