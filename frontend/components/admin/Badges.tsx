"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { CaseStatus, SosPriority, SosStatus, UnitStatus, UserRole, UserStatus } from "@/lib/admin/domain-types"

const PRIORITY_STYLES: Record<SosPriority, string> = {
  CRITICAL: "border-white/25 bg-white/10 text-white",
  HIGH: "border-white/15 bg-white/5 text-white/80",
  MEDIUM: "border-white/10 bg-transparent text-white/60",
  LOW: "border-white/5 bg-transparent text-white/40",
}

const STATUS_STYLES: Record<SosStatus, string> = {
  Active: "bg-white/10 text-white",
  Dispatched: "bg-white/5 text-white/70",
  Resolved: "bg-white/5 text-white/50",
}

const CASE_STATUS_STYLES: Record<CaseStatus, string> = {
  OPEN: "border-blue-400/30 bg-blue-400/10 text-blue-400",
  INVESTIGATING: "border-yellow-400/30 bg-yellow-400/10 text-yellow-400",
  CLOSED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
  ESCALATED: "border-[#C0392B]/30 bg-[#C0392B]/10 text-[#C0392B]",
}

const UNIT_STATUS_STYLES: Record<UnitStatus, string> = {
  available: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
  dispatched: "border-blue-400/30 bg-blue-400/10 text-blue-400",
  on_scene: "border-[#C0392B]/30 bg-[#C0392B]/10 text-[#C0392B]",
  offline: "border-white/10 bg-white/5 text-white/40",
}

const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  available: "Available",
  dispatched: "Dispatched",
  on_scene: "On Scene",
  offline: "Offline",
}

export function PriorityBadge({ priority }: { priority: SosPriority }) {
  return (
    <span className={cn("admin-badge border", PRIORITY_STYLES[priority])}>
      {priority}
    </span>
  )
}

export function StatusBadge({ status }: { status: SosStatus }) {
  return (
    <span className={cn("admin-badge", STATUS_STYLES[status], status === "Active" && "admin-pulse-dot")}>
      {status}
    </span>
  )
}

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span className={cn("admin-badge border", CASE_STATUS_STYLES[status])}>
      {status.replace("_", " ")}
    </span>
  )
}

export function UnitStatusBadge({
  status,
  pulse = false,
}: {
  status: UnitStatus
  pulse?: boolean
}) {
  const shouldPulse = pulse || status === "available" || status === "on_scene"

  return (
    <span className={cn("admin-badge inline-flex items-center gap-1.5 border", UNIT_STATUS_STYLES[status])}>
      {shouldPulse && status !== "offline" && (
        <span className="admin-pulse-dot h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {UNIT_STATUS_LABELS[status]}
    </span>
  )
}

const ROLE_STYLES: Record<UserRole, string> = {
  SUPER_ADMIN: "border-white/25 bg-white/10 text-white",
  ADMIN: "border-white/15 bg-white/5 text-white/80",
  POLICE: "border-blue-400/30 bg-blue-400/10 text-blue-400",
  GUARDIAN: "border-amber-400/30 bg-amber-400/10 text-amber-400",
  USER: "border-white/10 bg-transparent text-white/50",
}

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  POLICE: "Police",
  GUARDIAN: "Guardian",
  USER: "User",
}

const USER_STATUS_STYLES: Record<UserStatus, string> = {
  active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
  inactive: "border-white/10 bg-white/5 text-white/40",
}

export function RoleBadge({ role }: { role: string }) {
  const typedRole = role as UserRole
  const style = ROLE_STYLES[typedRole] ?? "border-white/10 bg-transparent text-white/50"
  const label = ROLE_LABELS[typedRole] ?? role.replace(/_/g, " ")
  return (
    <span
      className={cn(
        "admin-badge inline-flex shrink-0 whitespace-nowrap border normal-case tracking-normal",
        style
      )}
    >
      {label}
    </span>
  )
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <span className={cn("admin-badge border capitalize", USER_STATUS_STYLES[status])}>
      {status}
    </span>
  )
}

export function ViewAllLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="mt-4 inline-block text-sm text-white/50 transition hover:text-white">
      {label} →
    </Link>
  )
}
