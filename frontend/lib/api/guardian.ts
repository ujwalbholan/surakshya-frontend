import { API_BASE } from "./client"
import { getAccessToken } from "@/lib/auth/session"
import type { GuardianWardSosResponse, GuardianWardsResponse } from "./types"

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
