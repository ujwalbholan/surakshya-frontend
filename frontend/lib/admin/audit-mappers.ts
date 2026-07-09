import type { ApiAuditLogRecord } from "@/lib/api/types"
import type { AuditAction, MockAuditEntry } from "@/lib/admin/mock-data"

const KNOWN_ACTIONS = new Set<string>([
  "LOGIN",
  "LOGOUT",
  "CREATE_USER",
  "UPDATE_USER",
  "DELETE_USER",
  "CREATE_CASE",
  "UPDATE_CASE",
  "RESOLVE_SOS",
  "CREATE_UNIT",
  "UPDATE_UNIT",
])

function toAuditAction(action: string): AuditAction {
  if (KNOWN_ACTIONS.has(action)) {
    return action as AuditAction
  }
  return "UPDATE_USER"
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function mapApiAuditLogToEntry(log: ApiAuditLogRecord): MockAuditEntry {
  return {
    id: log.id,
    timestamp: formatTimestamp(log.created_at),
    admin: log.actor?.full_name ?? log.actor_role ?? "System",
    action: toAuditAction(log.action),
    target: log.target_label ?? log.target_entity_type ?? "—",
    ipAddress: log.ip_address ?? "—",
    result: log.result_label,
  }
}

export function mapApiAuditLogsToEntries(logs: ApiAuditLogRecord[]): MockAuditEntry[] {
  return logs.map(mapApiAuditLogToEntry)
}
