export type UserRole = "SUPER_ADMIN" | "ADMIN" | "POLICE" | "GUARDIAN" | "USER"
export type UserStatus = "active" | "inactive"
export type {
  SosPriority,
  SosStatus,
  EmergencyContact,
  SosTimelineEvent,
  AdminSosAlert,
} from "@/lib/admin/sos-types"
export type { AdminSosAlert as MockSosAlert } from "@/lib/admin/sos-types"
export type CaseStatus = "OPEN" | "INVESTIGATING" | "CLOSED" | "ESCALATED"
export type UnitStatus = "available" | "dispatched" | "on_scene" | "offline"
export type AuditAction =
  | "LOGIN"
  | "CREATE_USER"
  | "UPDATE_CASE"
  | "DELETE_USER"
  | "LOGOUT"
  | "UPDATE_USER"
  | "CREATE_CASE"
  | "RESOLVE_SOS"
  | "CREATE_UNIT"
  | "UPDATE_UNIT"

import type { SosPriority } from "@/lib/admin/sos-types"

export interface MockUser {
  id: string
  full_name: string
  email: string
  phone: string
  role: UserRole
  createdAt: string
  status: UserStatus
}

export interface MockCase {
  id: string
  uuid: string
  victim: string
  district: string
  province: string
  officer: string
  status: CaseStatus
  priority: SosPriority
  openedAt: string
  timeSince: string
  evidenceCount: number
  evidenceFiles: string[]
  notes: string[]
  statusHistory: { status: CaseStatus; timestamp: string }[]
}

export interface MockUnit {
  id: string
  uuid: string
  province: string
  zone: string
  officer: string
  vehicle: string
  status: UnitStatus
  activeCase?: string
  lastUpdated: string
}

export interface MockAuditEntry {
  id: string
  timestamp: string
  admin: string
  action: AuditAction
  target: string
  ipAddress: string
  result: "Success" | "Failed"
}
