import { surakshyaPublicRequest, API_BASE } from "./client"
import { getAccessToken } from "@/lib/auth/session"
import type {
  LoginRequest,
  LoginResult,
  ActivationPasswordResponse,
  ActivationVerifyResponse,
} from "./types"

export function loginUser(payload: LoginRequest) {
  return surakshyaPublicRequest<LoginResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function setPoliceActivationPassword(
  challengeToken: string,
  newPassword: string
) {
  return surakshyaPublicRequest<ActivationPasswordResponse>(
    "/police/activation/set-password",
    {
      method: "POST",
      body: JSON.stringify({ challengeToken, newPassword }),
    }
  )
}

export function verifyPoliceActivationOtp(challengeToken: string, otp: string) {
  return surakshyaPublicRequest<ActivationVerifyResponse>(
    "/police/activation/verify-otp",
    {
      method: "POST",
      body: JSON.stringify({ challengeToken, otp }),
    }
  )
}

export function setGuardianActivationPassword(
  challengeToken: string,
  newPassword: string
) {
  return surakshyaPublicRequest<ActivationPasswordResponse>(
    "/guardian/activation/set-password",
    {
      method: "POST",
      body: JSON.stringify({ challengeToken, newPassword }),
    }
  )
}

export function verifyGuardianActivationOtp(
  challengeToken: string,
  otp: string
) {
  return surakshyaPublicRequest<ActivationVerifyResponse>(
    "/guardian/activation/verify-otp",
    {
      method: "POST",
      body: JSON.stringify({ challengeToken, otp }),
    }
  )
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
