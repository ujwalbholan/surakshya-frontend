export type CaseStatus = "open" | "investigating" | "closed" | "escalated"
export type UnitStatus = "available" | "dispatched" | "on_scene" | "offline"

export interface PoliceCase {
  id: string
  uuid: string
  sosId: string
  victimName: string
  district: string
  openedAt: string
  status: CaseStatus
  assignedUnit: string
  officer: string
  summary: string
  evidenceCount: number
  priority: "high" | "medium" | "low"
}

export interface FieldUnit {
  id: string
  name: string
  province: string
  zone: string
  status: UnitStatus
  officers: number
  vehicle: string
  responseAvg: string
  activeCase?: string
  contact: string
}

export interface ReportMetric {
  label: string
  value: string
  period: string
  change: string
  positive: boolean
}

export interface MonthlySosStat {
  month: string
  alerts: number
  resolved: number
  avgMinutes: number
}
