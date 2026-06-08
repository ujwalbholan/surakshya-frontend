"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { SosPriority, SosStatus } from "@/lib/admin/mock-data"

const PRIORITY_STYLES: Record<SosPriority, string> = {
  CRITICAL: "bg-[#C0392B]/20 text-[#E74C3C] border-[#C0392B]/40",
  HIGH: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  MEDIUM: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  LOW: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
}

const STATUS_STYLES: Record<SosStatus, string> = {
  Active: "bg-[#C0392B]/20 text-[#E74C3C]",
  Dispatched: "bg-blue-500/10 text-blue-400",
  Resolved: "bg-emerald-500/10 text-emerald-400",
}

export function PriorityBadge({ priority }: { priority: SosPriority }) {
  return (
    <span className={cn("admin-badge border text-[10px] font-mono-admin uppercase", PRIORITY_STYLES[priority])}>
      {priority}
    </span>
  )
}

export function StatusBadge({ status }: { status: SosStatus }) {
  return (
    <span className={cn("admin-badge text-[10px] font-mono-admin uppercase", STATUS_STYLES[status], status === "Active" && "admin-pulse-dot")}>
      {status}
    </span>
  )
}

export function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    SUPER_ADMIN: "bg-white text-black",
    ADMIN: "bg-purple-500/20 text-purple-400",
    POLICE: "bg-blue-500/20 text-blue-400",
    GUARDIAN: "bg-yellow-500/20 text-yellow-400",
    USER: "bg-white/10 text-white/70",
  }
  return (
    <span className={cn("admin-badge text-[10px] font-mono-admin uppercase", styles[role] ?? "bg-white/10 text-white/70")}>
      {role.replace("_", " ")}
    </span>
  )
}

export function ViewAllLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="mt-4 inline-block text-sm text-[#C0392B] transition hover:text-[#E74C3C]">
      {label} →
    </Link>
  )
}
