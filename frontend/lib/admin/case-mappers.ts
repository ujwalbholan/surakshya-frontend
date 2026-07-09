import type { ApiCaseDetail, ApiCaseRecord } from "@/lib/api/types"
import type { CaseStatus, MockCase, SosPriority } from "@/lib/admin/mock-data"

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin} min`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay} day`
}

function toCaseStatus(status: string): CaseStatus {
  const upper = status.toUpperCase() as CaseStatus
  if (["OPEN", "INVESTIGATING", "CLOSED", "ESCALATED"].includes(upper)) {
    return upper
  }
  return "OPEN"
}

function toPriority(priority: string): SosPriority {
  const upper = priority.toUpperCase() as SosPriority
  if (["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(upper)) {
    return upper
  }
  return "MEDIUM"
}

export function mapApiCaseToMockCase(
  record: ApiCaseRecord,
  options?: { evidenceCount?: number; evidenceFiles?: string[] }
): MockCase {
  return {
    id: record.case_number,
    uuid: record.id,
    victim: record.victim_name ?? "—",
    district: record.district ?? "—",
    province: record.province ?? "—",
    officer: record.assigned_officer?.full_name ?? "Unassigned",
    status: toCaseStatus(record.status),
    priority: toPriority(record.priority),
    openedAt: record.opened_at,
    timeSince: formatRelativeTime(record.opened_at),
    evidenceCount: options?.evidenceCount ?? 0,
    evidenceFiles: options?.evidenceFiles ?? [],
    notes: [],
    statusHistory: [],
  }
}

export function mapApiCaseDetailToMockCase(detail: ApiCaseDetail): MockCase {
  return {
    ...mapApiCaseToMockCase(detail),
    notes: detail.notes.map((n) => n.body),
    statusHistory: detail.status_history.map((h) => ({
      status: toCaseStatus(h.status),
      timestamp: h.created_at,
    })),
  }
}

export function mapApiCasesToMockCases(records: ApiCaseRecord[]): MockCase[] {
  return records.map((r) => mapApiCaseToMockCase(r))
}
