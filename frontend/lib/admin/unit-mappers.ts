import type { ApiPatrolUnitRecord } from "@/lib/api/types"
import type { MockUnit, UnitStatus } from "@/lib/admin/domain-types"

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr ago`
  return new Date(iso).toLocaleDateString()
}

function toUnitStatus(status: string): UnitStatus {
  const lower = status.toLowerCase() as UnitStatus
  if (["available", "dispatched", "on_scene", "offline"].includes(lower)) {
    return lower
  }
  return "offline"
}

export function mapApiUnitToMockUnit(
  unit: ApiPatrolUnitRecord,
  activeCase?: string
): MockUnit {
  return {
    id: unit.name,
    uuid: unit.id,
    province: unit.province,
    zone: unit.zone,
    officer: unit.lead_officer?.full_name ?? "Unassigned",
    vehicle: unit.vehicle,
    status: toUnitStatus(unit.status),
    activeCase,
    lastUpdated: formatRelativeTime(unit.updated_at),
  }
}

export function mapApiUnitsToMockUnits(
  units: ApiPatrolUnitRecord[],
  caseNumberByUnitId?: Map<string, string>
): MockUnit[] {
  return units.map((unit) =>
    mapApiUnitToMockUnit(unit, caseNumberByUnitId?.get(unit.id))
  )
}
