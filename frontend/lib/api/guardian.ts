import { API_BASE, surakshyaPublicRequest } from "./client"
import { getAccessToken } from "@/lib/auth/session"
import type {
  ChildPendingRequestsResponse,
  GuardianLinkMessageResponse,
  GuardianPendingRequestsResponse,
  GuardianSetupMessageResponse,
  GuardianWardSosResponse,
  GuardianWardsResponse,
  InviteGuardianPayload,
  InviteGuardianResponse,
  InviteWardPayload,
  MyGuardiansResponse,
} from "./types"

function authHeaders(): HeadersInit {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function guardianRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
      ...options.headers,
    },
  })
  const text = await response.text()
  const body = text ? (JSON.parse(text) as T & { message?: string }) : null
  if (!response.ok) {
    throw new Error(body?.message ?? response.statusText ?? "Request failed")
  }
  if (body === null) {
    throw new Error("Invalid response from server")
  }
  return body as T
}

export function fetchMyWards(page = 1, limit = 20) {
  return guardianRequest<GuardianWardsResponse>(
    `/guardian/me?page=${page}&limit=${limit}`
  )
}

export function fetchWardSos(wardId: string) {
  return guardianRequest<GuardianWardSosResponse>(
    `/guardian/wards/${wardId}/sos`
  )
}

export function inviteGuardian(payload: InviteGuardianPayload) {
  return guardianRequest<InviteGuardianResponse>("/guardians", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function fetchMyGuardians(page = 1, limit = 20) {
  return guardianRequest<MyGuardiansResponse>(
    `/guardians?page=${page}&limit=${limit}`
  )
}

export function fetchChildPendingRequests() {
  return guardianRequest<ChildPendingRequestsResponse>("/guardians/requests")
}

export function acceptChildRequest(requestId: string) {
  return guardianRequest<GuardianLinkMessageResponse>(
    `/guardians/requests/${requestId}/accept`,
    { method: "POST" }
  )
}

export function rejectChildRequest(requestId: string) {
  return guardianRequest<GuardianLinkMessageResponse>(
    `/guardians/requests/${requestId}/reject`,
    { method: "POST" }
  )
}

export function inviteWard(payload: InviteWardPayload) {
  return guardianRequest<GuardianLinkMessageResponse>("/guardian/add-ward", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function fetchGuardianPendingRequests() {
  return guardianRequest<GuardianPendingRequestsResponse>("/guardian/requests")
}

export function acceptGuardianRequest(requestId: string) {
  return guardianRequest<GuardianLinkMessageResponse>(
    `/guardian/requests/${requestId}/accept`,
    { method: "POST" }
  )
}

export function rejectGuardianRequest(requestId: string) {
  return guardianRequest<GuardianLinkMessageResponse>(
    `/guardian/requests/${requestId}/reject`,
    { method: "POST" }
  )
}

export function guardianSendOtp(email: string) {
  return surakshyaPublicRequest<GuardianSetupMessageResponse>(
    "/guardian/send-otp",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    }
  )
}

export function guardianVerifyOtp(email: string, otp: string) {
  return surakshyaPublicRequest<GuardianSetupMessageResponse>(
    "/guardian/verify-otp",
    {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }
  )
}

export function guardianSetPassword(
  email: string,
  oldPassword: string,
  newPassword: string
) {
  return surakshyaPublicRequest<GuardianSetupMessageResponse>(
    "/guardian/set-password",
    {
      method: "POST",
      body: JSON.stringify({ email, oldPassword, newPassword }),
    }
  )
}
