import type { AuthTokens } from "@/lib/api/types"

const ACCESS_TOKEN_KEY = "suraksha_access_token"
const REFRESH_TOKEN_KEY = "suraksha_refresh_token"
const USER_EMAIL_KEY = "suraksha_user_email"
const USER_ROLE_KEY = "suraksha_user_role"

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

export function getRedirectForRole(
  role: string,
  nextPath?: string | null
): string {
  if (nextPath?.startsWith("/dashboard") && role === "POLICE") return nextPath
  switch (role) {
    case "POLICE":
      return "/dashboard"
    case "ADMIN":
    case "SUPER_ADMIN":
      return "/admin"
    default:
      return "/app"
  }
}
