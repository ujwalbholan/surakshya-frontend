import { adminApiRequest } from "./client"
import type { AdminUser } from "@/lib/auth/admin-session"

export interface AdminLoginResponse {
  user: AdminUser
  message?: string
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

export function adminLogin(email: string, password: string) {
  return adminApiRequest<AdminLoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export function adminLogout() {
  return adminApiRequest<null>("/auth/logout", { method: "POST" })
}

export function registerAdminUser(payload: RegisterAdminUserRequest) {
  return adminApiRequest<RegisterAdminUserResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function forgetPassword(email: string) {
  return adminApiRequest<{ message?: string }>("/auth/forget-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}

export function verifyResetOtp(email: string, otp: string) {
  return adminApiRequest<VerifyResetOtpResponse>("/auth/verify-reset-opt", {
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

export function fetchUserCount() {
  return adminApiRequest<UserCountResponse>("/users/count")
}

export function fetchUsers() {
  return adminApiRequest<AdminUser[]>("/users")
}

export function checkHealth() {
  return adminApiRequest<{ status?: string }>("/health")
}
