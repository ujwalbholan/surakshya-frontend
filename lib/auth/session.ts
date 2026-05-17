import type { AuthTokens } from "@/lib/api/types"

const ACCESS_TOKEN_KEY = "suraksha_access_token"
const REFRESH_TOKEN_KEY = "suraksha_refresh_token"
const USER_EMAIL_KEY = "suraksha_user_email"

export function saveAuthSession(email: string, tokens: AuthTokens) {
  if (typeof window === "undefined") return
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
  localStorage.setItem(USER_EMAIL_KEY, email)
}

export function clearAuthSession() {
  if (typeof window === "undefined") return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_EMAIL_KEY)
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getStoredEmail(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(USER_EMAIL_KEY)
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken())
}
