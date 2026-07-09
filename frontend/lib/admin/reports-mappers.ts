import type { ApiReportRange } from "@/lib/api/types"
import type { ReportRange } from "@/lib/admin/reports-data"

export function uiRangeToApiRange(range: ReportRange): ApiReportRange {
  if (range === "7 days") return "7d"
  if (range === "90 days") return "90d"
  return "30d"
}

export function provinceShortLabel(province: string): string {
  if (province === "Province 1") return "Prov. 1"
  return province.replace("Sudurpaschim", "Sudurp.")
}
