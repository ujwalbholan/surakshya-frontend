import type { AuthTokens } from "@/lib/api/types"

const ACCESS_TOKEN_KEY = "surakshya_access_token"
const REFRESH_TOKEN_KEY = "surakshya_refresh_token"
const USER_EMAIL_KEY = "surakshya_user_email"
const USER_ROLE_KEY = "surakshya_user_role"

export function saveAuthSession(
  email: string,
  tokens: AuthTokens,
  role?: string
) {
  if (typeof window === "undefined") return
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  localStorage.setItem(USER_EMAIL_KEY, email)
  if (role) {
    localStorage.setItem(USER_ROLE_KEY, role)
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_EMAIL_KEY)
  localStorage.removeItem(USER_ROLE_KEY)
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getStoredEmail(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(USER_EMAIL_KEY)
}

export function getStoredRole(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(USER_ROLE_KEY)
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken())
}

function defaultRedirectForRole(role: string): string {
  switch (role) {
    case "POLICE":
      return "/dashboard"
    case "ADMIN":
    case "SUPER_ADMIN":
      return "/admin"
    case "GUARDIAN":
      return "/guardian"
    default:
      return "/"
  }
}

export function getRedirectForRole(
  role: string,
  nextPath?: string | null
): string {
  if (!nextPath || nextPath === "/app" || nextPath.startsWith("/app/")) {
    return defaultRedirectForRole(role)
  }

  if (role === "POLICE" && nextPath.startsWith("/dashboard")) {
    return nextPath
  }
  if (
    (role === "ADMIN" || role === "SUPER_ADMIN") &&
    nextPath.startsWith("/admin")
  ) {
    return nextPath
  }
  if (role === "GUARDIAN" && nextPath.startsWith("/guardian")) {
    return nextPath
  }

  return defaultRedirectForRole(role)
}
