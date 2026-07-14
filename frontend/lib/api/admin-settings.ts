import { adminApiRequest } from "./client"

export interface AdminNotificationChannels {
  email?: boolean
  push?: boolean
  sms?: boolean
}

export interface AdminNotificationsSettings {
  newSos?: AdminNotificationChannels
  sosUnack?: AdminNotificationChannels
  newUser?: AdminNotificationChannels
  caseChange?: AdminNotificationChannels
  systemHealth?: AdminNotificationChannels
}

export interface AdminSettings {
  platform_name: string
  support_email: string
  language: string
  session_timeout: string
  api_url: string
  api_timeout: string
  notifications: AdminNotificationsSettings
  [key: string]: unknown
}

export interface AdminSettingsResponse {
  message: string
  settings: AdminSettings
}

export type UpdateAdminSettingsPayload = Partial<{
  platform_name: string
  support_email: string
  language: string
  session_timeout: string
  api_url: string
  api_timeout: string
  notifications: AdminNotificationsSettings
}>

export function fetchAdminSettings() {
  return adminApiRequest<AdminSettingsResponse>("/admin/settings")
}

export function updateAdminSettings(payload: UpdateAdminSettingsPayload) {
  return adminApiRequest<AdminSettingsResponse>("/admin/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}
