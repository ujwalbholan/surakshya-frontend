export interface AdminUser {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
}

const ADMIN_SESSION_KEY = "suraksha_admin_session"
const ADMIN_ACCESS_TOKEN_KEY = "suraksha_admin_access_token"
const ADMIN_REFRESH_TOKEN_KEY = "suraksha_admin_refresh_token"

export function getAdminAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY)
}

export function getAdminRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY)
}

export function getAdminSession(): AdminUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AdminUser
    if (!parsed.id || !parsed.email || !parsed.role) return null
    return parsed
  } catch {
    return null
  }
}

export function setAdminSession(
  user: AdminUser,
  tokens?: { accessToken: string; refreshToken: string }
): void {
  if (typeof window === "undefined") return
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user))
  if (tokens) {
    localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, tokens.accessToken)
    localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, tokens.refreshToken)
  }
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(ADMIN_SESSION_KEY)
  localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY)
  localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return getAdminSession() !== null
}
