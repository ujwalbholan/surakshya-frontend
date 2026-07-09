import { adminApiRequest } from "./client"
import type {
  AdminDailySeriesResponse,
  AdminProvinceBreakdownResponse,
  AdminReportSummaryResponse,
  ApiReportRange,
} from "./types"

function withRange(range?: ApiReportRange) {
  return range ? `?range=${range}` : ""
}

export async function fetchAdminReportSummary(range?: ApiReportRange) {
  return adminApiRequest<AdminReportSummaryResponse>(
    `/admin/reports/summary${withRange(range)}`
  )
}

export async function fetchAdminReportDailySeries(range?: ApiReportRange) {
  return adminApiRequest<AdminDailySeriesResponse>(
    `/admin/reports/daily-series${withRange(range)}`
  )
}

export async function fetchAdminReportProvinceBreakdown(range?: ApiReportRange) {
  return adminApiRequest<AdminProvinceBreakdownResponse>(
    `/admin/reports/province-breakdown${withRange(range)}`
  )
}
