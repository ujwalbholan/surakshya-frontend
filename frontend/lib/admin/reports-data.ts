export type ReportRange = "7 days" | "30 days" | "90 days" | "Custom"

export const REPORT_RANGES: ReportRange[] = ["7 days", "30 days", "90 days", "Custom"]

export interface ProvinceReportRow {
  province: string
  totalSos: number
  resolved: number
  avgResponse: string
  units: number
  coverage: number
}

export function buildProvinceCsv(rows: ProvinceReportRow[]) {
  const header = "Province,Total SOS,Resolved,Avg Response,Units,Coverage"
  const body = rows
    .map((r) => `${r.province},${r.totalSos},${r.resolved},${r.avgResponse},${r.units},${r.coverage}%`)
    .join("\n")
  return `${header}\n${body}`
}
