import type { MockUser, UserRole, UserStatus } from "@/lib/admin/mock-data"

export type UserRoleFilter = UserRole | "ALL"
export type UserStatusFilter = UserStatus | "all"

export const USER_ROLES: UserRoleFilter[] = [
  "ALL",
  "USER",
  "GUARDIAN",
  "POLICE",
  "ADMIN",
  "SUPER_ADMIN",
]

export const USER_STATUSES: UserStatusFilter[] = ["all", "active", "inactive"]

export function filterUsers(
  users: MockUser[],
  search: string,
  role: UserRoleFilter,
  status: UserStatusFilter
): MockUser[] {
  const q = search.toLowerCase().trim()
  return users.filter((user) => {
    const matchSearch =
      !q ||
      user.full_name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.phone.includes(q) ||
      user.id.toLowerCase().includes(q)
    const matchRole = role === "ALL" || user.role === role
    const matchStatus = status === "all" || user.status === status
    return matchSearch && matchRole && matchStatus
  })
}

export function getUserSummary(users: MockUser[]) {
  return {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status === "inactive").length,
    staff: users.filter((u) => ["SUPER_ADMIN", "ADMIN", "POLICE"].includes(u.role)).length,
    appUsers: users.filter((u) => u.role === "USER").length,
  }
}

export function formatJoinDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function roleLabel(role: UserRole) {
  return role.replace("_", " ")
}
