import { adminApiRequest } from "./client"
import type { AdminUser } from "@/lib/auth/admin-session"
import { getAdminAccessToken } from "@/lib/auth/admin-session"

export interface AdminLoginResponse {
  user: AdminUser
  message?: string
  accessToken: string
  refreshToken: string
}

export interface RegisterAdminUserRequest {
  full_name: string
  email: string
  password: string
  phone: string
  role: string
}

export interface RegisterAdminUserResponse {
  id: string
  email: string
  message?: string
}

export interface ForgetPasswordRequest {
  email: string
}

export interface VerifyResetOtpRequest {
  email: string
  otp: string
}

export interface VerifyResetOtpResponse {
  resetToken: string
  message?: string
}

export interface ResetPasswordRequest {
  email: string
  newPassword: string
  comparePassword: string
  resetToken: string
}

export interface UserCountResponse {
  count: number
}

export interface AdminUserRecord {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
  is_active: boolean
  created_at: string
}

export interface AdminUsersListResponse {
  data: AdminUserRecord[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface UserRoleCount {
  role: string
  count: number
}

export interface AdminStatsResponse {
  totalUsers: number
  totalDevices: number
  totalPings: number
  activeSosEvents: number
  usersByRole: UserRoleCount[]
  newUsersToday: number
  pingsToday: number
  resolvedSosToday: number
}

export function adminLogin(email: string, password: string) {
  return adminApiRequest<AdminLoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export function adminLogout() {
  const token = getAdminAccessToken()
  return adminApiRequest<null>("/auth/logout", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export function registerAdminUser(payload: RegisterAdminUserRequest) {
  return adminApiRequest<RegisterAdminUserResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function forgetPassword(email: string) {
  return adminApiRequest<{ message?: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}

export function verifyResetOtp(email: string, otp: string) {
  return adminApiRequest<VerifyResetOtpResponse>("/auth/verify-reset-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  })
}

export function resetPassword(payload: ResetPasswordRequest) {
  return adminApiRequest<{ message?: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function refreshSession() {
  return adminApiRequest<null>("/auth/refresh", { method: "POST" })
}

export function fetchAdminStats() {
  return adminApiRequest<AdminStatsResponse>("/admin/stats")
}

export async function fetchUserCount() {
  const result = await fetchAdminStats()
  return {
    ...result,
    data: result.data ? { count: result.data.totalUsers } : null,
  }
}

export function fetchUsers(params?: {
  page?: number
  limit?: number
  role?: string
  search?: string
}) {
  const query = new URLSearchParams()
  if (params?.page) query.set("page", String(params.page))
  query.set("limit", String(params?.limit ?? 100))
  if (params?.role) query.set("role", params.role)
  if (params?.search) query.set("search", params.search)
  const qs = query.toString()
  return adminApiRequest<AdminUsersListResponse>(`/admin/users?${qs}`)
}

export function checkHealth() {
  return adminApiRequest<{
    status?: string
    timestamp?: string
    uptime?: number
    uptime_ms?: number
    database?: "up" | "down"
    database_latency_ms?: number | null
  }>("/health")
}
