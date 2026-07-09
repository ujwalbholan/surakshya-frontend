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

const _policeCases = [
  {
    id: "CASE-2026-0891",
    sosId: "SOS-2847",
    victimName: "Priya Sharma",
    district: "Kathmandu",
    openedAt: "17 May 2026 · 07:38 NPT",
    status: "investigating",
    assignedUnit: "Unit 12 — Metro",
    officer: "Insp. Bikash Thapa",
    summary: "Double-tap SOS from Thamel. Victim en route home; live GPS active. Family notified.",
    evidenceCount: 3,
    priority: "high",
  },
  {
    id: "CASE-2026-0890",
    sosId: "SOS-2846",
    victimName: "Ananya Karki",
    district: "Lalitpur",
    openedAt: "17 May 2026 · 07:30 NPT",
    status: "open",
    assignedUnit: "Unit 12 — Metro",
    officer: "Sub-Insp. Sunita Rai",
    summary: "Pulchowk area alert. Unit dispatched; awaiting on-scene confirmation.",
    evidenceCount: 2,
    priority: "high",
  },
  {
    id: "CASE-2026-0889",
    sosId: "SOS-2845",
    victimName: "Meera Thapa",
    district: "Kaski",
    openedAt: "17 May 2026 · 07:24 NPT",
    status: "investigating",
    assignedUnit: "Unit 4 — Western",
    officer: "Insp. Rajesh Gurung",
    summary: "Lakeside Pokhara SOS. Safe Walk deviation detected prior to tap.",
    evidenceCount: 4,
    priority: "medium",
  },
  {
    id: "CASE-2026-0885",
    sosId: "SOS-2844",
    victimName: "Sunita Rai",
    district: "Morang",
    openedAt: "16 May 2026 · 22:15 NPT",
    status: "closed",
    assignedUnit: "Unit 7 — Eastern",
    officer: "Insp. Hari Karki",
    summary: "Resolved on-scene. Victim reunited with family. False alarm ruled out.",
    evidenceCount: 5,
    priority: "medium",
  },
  {
    id: "CASE-2026-0880",
    sosId: "SOS-2831",
    victimName: "Kamala Shrestha",
    district: "Chitwan",
    openedAt: "16 May 2026 · 19:42 NPT",
    status: "escalated",
    assignedUnit: "Unit 3 — Central",
    officer: "DSP Anil Malla",
    summary: "Repeat SOS within 24h. Escalated to district HQ for follow-up patrol.",
    evidenceCount: 7,
    priority: "high",
  },
  {
    id: "CASE-2026-0872",
    sosId: "SOS-2819",
    victimName: "Rina Gurung",
    district: "Bhaktapur",
    openedAt: "15 May 2026 · 21:08 NPT",
    status: "closed",
    assignedUnit: "Unit 9 — Valley",
    officer: "Insp. Pasang Lama",
    summary: "Durbar Square area. Victim assisted to safe location; case closed.",
    evidenceCount: 3,
    priority: "low",
  },
]

export const policeCases: PoliceCase[] = _policeCases.map((c) => ({ ...c, uuid: c.id })) as PoliceCase[]

export const fieldUnits: FieldUnit[] = [
  {
    id: "UNIT-12",
    name: "Unit 12 — Metro",
    province: "Bagmati",
    zone: "Kathmandu Valley",
    status: "dispatched",
    officers: 4,
    vehicle: "NP 1-2345 · Patrol Jeep",
    responseAvg: "3.8 min",
    activeCase: "CASE-2026-0891",
    contact: "+977 985-100-0012",
  },
  {
    id: "UNIT-09",
    name: "Unit 9 — Valley",
    province: "Bagmati",
    zone: "Bhaktapur / Madhyapur",
    status: "available",
    officers: 3,
    vehicle: "NP 1-1189 · Motorcycle Squad",
    responseAvg: "4.1 min",
    contact: "+977 985-100-0009",
  },
  {
    id: "UNIT-04",
    name: "Unit 4 — Western",
    province: "Gandaki",
    zone: "Pokhara / Kaski",
    status: "on_scene",
    officers: 5,
    vehicle: "NP 4-0567 · Patrol Van",
    responseAvg: "5.2 min",
    activeCase: "CASE-2026-0889",
    contact: "+977 985-100-0004",
  },
  {
    id: "UNIT-07",
    name: "Unit 7 — Eastern",
    province: "Koshi",
    zone: "Biratnagar / Morang",
    status: "available",
    officers: 4,
    vehicle: "NP 7-0234 · Patrol Jeep",
    responseAvg: "4.6 min",
    contact: "+977 985-100-0007",
  },
  {
    id: "UNIT-03",
    name: "Unit 3 — Central",
    province: "Bagmati",
    zone: "Chitwan / Makwanpur",
    status: "dispatched",
    officers: 6,
    vehicle: "NP 3-0891 · Armed Response",
    responseAvg: "6.1 min",
    activeCase: "CASE-2026-0880",
    contact: "+977 985-100-0003",
  },
  {
    id: "UNIT-15",
    name: "Unit 15 — Terai",
    province: "Madhesh",
    zone: "Janakpur / Dhanusha",
    status: "offline",
    officers: 3,
    vehicle: "NP 15-0445 · Patrol Jeep",
    responseAvg: "7.4 min",
    contact: "+977 985-100-0015",
  },
]

export const reportMetrics: ReportMetric[] = [
  { label: "Total SOS (30 days)", value: "412", period: "Apr–May 2026", change: "+12%", positive: false },
  { label: "Avg response time", value: "4.2 min", period: "National", change: "−18%", positive: true },
  { label: "Cases closed", value: "389", period: "94.4% resolution", change: "+6%", positive: true },
  { label: "False alarms", value: "23", period: "5.6% of total", change: "−3%", positive: true },
]

export const monthlySosStats: MonthlySosStat[] = [
  { month: "Dec", alerts: 298, resolved: 281, avgMinutes: 5.1 },
  { month: "Jan", alerts: 312, resolved: 295, avgMinutes: 4.9 },
  { month: "Feb", alerts: 334, resolved: 318, avgMinutes: 4.7 },
  { month: "Mar", alerts: 356, resolved: 340, avgMinutes: 4.5 },
  { month: "Apr", alerts: 378, resolved: 361, avgMinutes: 4.3 },
  { month: "May", alerts: 412, resolved: 389, avgMinutes: 4.2 },
]

export const districtBreakdown = [
  { district: "Kathmandu", alerts: 142, share: 34 },
  { district: "Lalitpur", alerts: 68, share: 17 },
  { district: "Pokhara (Kaski)", alerts: 54, share: 13 },
  { district: "Chitwan", alerts: 41, share: 10 },
  { district: "Biratnagar", alerts: 38, share: 9 },
  { district: "Other", alerts: 69, share: 17 },
]

export const evidenceTypes = [
  { type: "GPS track log", count: 412, icon: "map" },
  { type: "Audio capture", count: 287, icon: "mic" },
  { type: "Family contact log", count: 398, icon: "phone" },
  { type: "Officer bodycam", count: 156, icon: "camera" },
]

export const notificationSettings = [
  { id: "double_tap", label: "Double-tap SOS alerts", description: "Instant push when wristband sensor is activated", enabled: true },
  { id: "critical", label: "Critical priority only", description: "Mute medium/low until acknowledged", enabled: false },
  { id: "sound", label: "Alert sound", description: "Audible siren in command centre", enabled: true },
  { id: "sms", label: "SMS backup", description: "Text to duty officer mobile if offline", enabled: true },
  { id: "email", label: "Daily digest email", description: "Summary at 06:00 NPT", enabled: false },
]

export const systemSettings = [
  { id: "auto_dispatch", label: "Auto-dispatch nearest unit", description: "Assign closest available unit on critical SOS", enabled: true },
  { id: "live_gps", label: "Live GPS refresh", description: "Update victim location every 5 seconds", enabled: true },
  { id: "evidence_lock", label: "Tamper-proof evidence", description: "AES-256 chain of custody for recordings", enabled: true },
  { id: "nepali", label: "Nepali interface", description: "Show labels in नेपाली alongside English", enabled: false },
]
