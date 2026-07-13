import { surakshyaPublicRequest, API_BASE } from "./client"
import { getAccessToken } from "@/lib/auth/session"
import type { LoginRequest, LoginResponse } from "./types"

export function loginUser(payload: LoginRequest) {
  return surakshyaPublicRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function logoutUser(): Promise<void> {
  const token = getAccessToken()
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch {
    // Best-effort server logout; client session cleared regardless.
  }
}
