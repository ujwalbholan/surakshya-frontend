import { NEPAL_PROVINCES } from "@/lib/admin/mock-data"

export type ReportRange = "7 days" | "30 days" | "90 days" | "Custom"

export const REPORT_RANGES: ReportRange[] = ["7 days", "30 days", "90 days", "Custom"]

const RANGE_DAYS: Record<ReportRange, number> = {
  "7 days": 7,
  "30 days": 30,
  "90 days": 90,
  Custom: 30,
}

function seededValue(seed: number, min: number, max: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  const normalized = x - Math.floor(x)
  return min + normalized * (max - min)
}

function formatChartDate(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function buildDailySeries(days: number) {
  const now = new Date()
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - (days - 1 - i))
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const seed = days * 100 + i

    return {
      date: formatChartDate(date),
      sos: Math.round((isWeekend ? 8 : 4) + seededValue(seed, 0, 6)),
      minutes: Number(seededValue(seed + 1, 3.2, 7.1).toFixed(1)),
      open: Math.round(seededValue(seed + 2, 1, 5)),
      resolved: Math.round(seededValue(seed + 3, 3, 10)),
      escalated: Math.round(seededValue(seed + 4, 0, 2)),
      users: Math.round(900 + i * 4 + seededValue(seed + 5, 0, 10)),
    }
  })
}

const DAILY_SERIES_90 = buildDailySeries(90)

const PROVINCE_SOS = [42, 28, 35, 22, 18, 8, 12]
const PROVINCE_RESOLVED = [38, 25, 30, 20, 15, 7, 10]
const PROVINCE_AVG_RESPONSE = ["4.1", "4.8", "5.2", "4.5", "5.0", "6.2", "5.8"]
const PROVINCE_UNITS = [4, 2, 3, 2, 1, 1, 1]
const PROVINCE_COVERAGE = [92, 78, 85, 70, 65, 45, 55]

export const PROVINCE_BAR_DATA = NEPAL_PROVINCES.map((province, i) => ({
  province,
  shortLabel: province === "Province 1" ? "Prov. 1" : province.replace("Sudurpaschim", "Sudurp."),
  sos: PROVINCE_SOS[i],
}))

export const PROVINCE_TABLE_DATA = NEPAL_PROVINCES.map((province, i) => ({
  province,
  totalSos: PROVINCE_SOS[i],
  resolved: PROVINCE_RESOLVED[i],
  avgResponse: PROVINCE_AVG_RESPONSE[i],
  units: PROVINCE_UNITS[i],
  coverage: PROVINCE_COVERAGE[i],
  resolutionRate: Math.round((PROVINCE_RESOLVED[i] / PROVINCE_SOS[i]) * 100),
}))

export function getReportSummary(range: ReportRange) {
  const days = RANGE_DAYS[range]
  const slice = DAILY_SERIES_90.slice(-days)
  const totalSos = slice.reduce((sum, d) => sum + d.sos, 0)
  const avgResponse =
    slice.reduce((sum, d) => sum + d.minutes, 0) / Math.max(slice.length, 1)
  const totalResolved = PROVINCE_TABLE_DATA.reduce((sum, r) => sum + r.resolved, 0)
  const totalCases = PROVINCE_TABLE_DATA.reduce((sum, r) => sum + r.totalSos, 0)
  const resolutionRate = Math.round((totalResolved / totalCases) * 100)
  const avgCoverage = Math.round(
    PROVINCE_TABLE_DATA.reduce((sum, r) => sum + r.coverage, 0) / PROVINCE_TABLE_DATA.length
  )

  return {
    totalSos,
    avgResponse: avgResponse.toFixed(1),
    resolutionRate,
    avgCoverage,
    activeUnits: PROVINCE_TABLE_DATA.reduce((sum, r) => sum + r.units, 0),
  }
}

export function getResponseTrend(range: ReportRange) {
  return DAILY_SERIES_90.slice(-RANGE_DAYS[range]).map(({ date, minutes }) => ({
    date,
    minutes,
  }))
}

export function getStatusTrend(range: ReportRange) {
  return DAILY_SERIES_90.slice(-RANGE_DAYS[range]).map(({ date, open, resolved, escalated }) => ({
    date,
    open,
    resolved,
    escalated,
  }))
}

export function getUserGrowth(range: ReportRange) {
  const days = range === "90 days" ? 90 : RANGE_DAYS[range]
  return DAILY_SERIES_90.slice(-days).map(({ date, users }) => ({ date, users }))
}

export function getProvinceTableForRange(range: ReportRange) {
  const factor = range === "7 days" ? 0.28 : range === "90 days" ? 1 : range === "Custom" ? 1 : 1
  return PROVINCE_TABLE_DATA.map((row) => ({
    ...row,
    totalSos: Math.max(1, Math.round(row.totalSos * factor)),
    resolved: Math.max(1, Math.round(row.resolved * factor)),
  }))
}

export function buildProvinceCsv(rows: typeof PROVINCE_TABLE_DATA) {
  const header = "Province,Total SOS,Resolved,Avg Response,Units,Coverage"
  const body = rows
    .map((r) => `${r.province},${r.totalSos},${r.resolved},${r.avgResponse},${r.units},${r.coverage}%`)
    .join("\n")
  return `${header}\n${body}`
}
