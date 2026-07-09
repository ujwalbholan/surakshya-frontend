import type { ApiCaseDetail, ApiCaseRecord, ApiPatrolUnitRecord } from "@/lib/api/types"
import type {
  CaseStatus,
  FieldUnit,
  PoliceCase,
  UnitStatus,
} from "@/lib/dashboard/operations-data"

function toPoliceCaseStatus(status: string): CaseStatus {
  return status.toLowerCase() as CaseStatus
}

function toPolicePriority(priority: string): PoliceCase["priority"] {
  const lower = priority.toLowerCase()
  if (lower === "critical" || lower === "high") return "high"
  if (lower === "low") return "low"
  return "medium"
}

function formatOpenedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kathmandu",
  })
}

export function mapApiCaseToPoliceCase(
  record: ApiCaseRecord,
  evidenceCount = 0
): PoliceCase {
  return {
    id: record.case_number,
    uuid: record.id,
    sosId: record.sos_event_id ?? "—",
    victimName: record.victim_name ?? "—",
    district: record.district ?? "—",
    openedAt: formatOpenedAt(record.opened_at),
    status: toPoliceCaseStatus(record.status),
    assignedUnit: record.assigned_unit?.name ?? "Unassigned",
    officer: record.assigned_officer?.full_name ?? "Unassigned",
    summary: record.summary,
    evidenceCount,
    priority: toPolicePriority(record.priority),
  }
}

export function mapApiCaseDetailToPoliceCase(detail: ApiCaseDetail, evidenceCount = 0): PoliceCase {
  return mapApiCaseToPoliceCase(detail, evidenceCount)
}

function toUnitStatus(status: string): UnitStatus {
  const lower = status.toLowerCase() as UnitStatus
  if (["available", "dispatched", "on_scene", "offline"].includes(lower)) {
    return lower
  }
  return "offline"
}

export function mapApiUnitToFieldUnit(
  unit: ApiPatrolUnitRecord,
  activeCase?: string
): FieldUnit {
  return {
    id: unit.id,
    name: unit.name,
    province: unit.province,
    zone: unit.zone,
    status: toUnitStatus(unit.status),
    officers: 1,
    vehicle: unit.vehicle,
    responseAvg: "—",
    activeCase,
    contact: unit.contact_phone ?? unit.lead_officer?.phone ?? "—",
  }
}
