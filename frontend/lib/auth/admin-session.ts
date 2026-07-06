export interface AdminUser {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
}

const ADMIN_SESSION_KEY = "suraksha_admin_session"

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

export function setAdminSession(user: AdminUser): void {
  if (typeof window === "undefined") return
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user))
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(ADMIN_SESSION_KEY)
}

export function isAuthenticated(): boolean {
  return getAdminSession() !== null
}
