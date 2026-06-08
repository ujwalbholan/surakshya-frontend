export type UserRole = "SUPER_ADMIN" | "ADMIN" | "POLICE" | "GUARDIAN" | "USER"
export type UserStatus = "active" | "inactive"
export type SosPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
export type SosStatus = "Active" | "Dispatched" | "Resolved"
export type CaseStatus = "OPEN" | "INVESTIGATING" | "CLOSED" | "ESCALATED"
export type UnitStatus = "available" | "dispatched" | "on_scene" | "offline"
export type AuditAction = "LOGIN" | "CREATE_USER" | "UPDATE_CASE" | "DELETE_USER" | "LOGOUT" | "UPDATE_USER"

export interface MockUser {
  id: string
  full_name: string
  email: string
  phone: string
  role: UserRole
  createdAt: string
  status: UserStatus
}

export interface EmergencyContact {
  relation: string
  name: string
  phone: string
  notified: boolean
}

export interface SosTimelineEvent {
  time: string
  description: string
}

export interface MockSosAlert {
  id: string
  victim: string
  age: number
  bloodType: string
  phone: string
  location: string
  district: string
  ward: string
  address: string
  lat: number
  lng: number
  priority: SosPriority
  status: SosStatus
  triggeredAt: string
  timeAgo: string
  timeline: SosTimelineEvent[]
  emergencyContacts: EmergencyContact[]
  assignedUnit?: {
    name: string
    officer: string
    vehicle: string
    status: string
  }
}

export interface MockCase {
  id: string
  victim: string
  district: string
  province: string
  officer: string
  status: CaseStatus
  priority: SosPriority
  openedAt: string
  timeSince: string
  evidenceCount: number
  evidenceFiles: string[]
  notes: string[]
  statusHistory: { status: CaseStatus; timestamp: string }[]
}

export interface MockUnit {
  id: string
  province: string
  zone: string
  officer: string
  vehicle: string
  status: UnitStatus
  activeCase?: string
  lastUpdated: string
}

export interface MockAuditEntry {
  id: string
  timestamp: string
  admin: string
  action: AuditAction
  target: string
  ipAddress: string
  result: "Success" | "Failed"
}

export const MOCK_USERS: MockUser[] = [
  {
    id: "usr-001",
    full_name: "Ujwal Bholan",
    email: "ujwalbholan@gmail.com",
    phone: "+977-999-998-988",
    role: "SUPER_ADMIN",
    createdAt: "2024-01-15",
    status: "active",
  },
  {
    id: "usr-002",
    full_name: "Aarav Sharma",
    email: "aarav@suraksha.com.np",
    phone: "+977-980-123-4567",
    role: "ADMIN",
    createdAt: "2024-02-20",
    status: "active",
  },
  {
    id: "usr-003",
    full_name: "Inspector Binod Thapa",
    email: "binod@nepalpolice.gov.np",
    phone: "+977-985-111-2233",
    role: "POLICE",
    createdAt: "2024-03-10",
    status: "active",
  },
  {
    id: "usr-004",
    full_name: "Dr. Sunita Karki",
    email: "sunita.karki@health.gov.np",
    phone: "+977-984-555-6677",
    role: "GUARDIAN",
    createdAt: "2024-04-05",
    status: "active",
  },
  {
    id: "usr-005",
    full_name: "Priya Sharma",
    email: "priya.sharma@gmail.com",
    phone: "+977-981-234-5678",
    role: "USER",
    createdAt: "2025-01-12",
    status: "active",
  },
  {
    id: "usr-006",
    full_name: "Maya Gurung",
    email: "maya.gurung@yahoo.com",
    phone: "+977-982-345-6789",
    role: "USER",
    createdAt: "2025-02-18",
    status: "active",
  },
  {
    id: "usr-007",
    full_name: "Sita Rai",
    email: "sita.rai@gmail.com",
    phone: "+977-983-456-7890",
    role: "USER",
    createdAt: "2025-03-22",
    status: "active",
  },
  {
    id: "usr-008",
    full_name: "Anita KC",
    email: "anita.kc@outlook.com",
    phone: "+977-984-567-8901",
    role: "USER",
    createdAt: "2025-04-01",
    status: "active",
  },
  {
    id: "usr-009",
    full_name: "Rupa Thapa",
    email: "rupa.thapa@gmail.com",
    phone: "+977-985-678-9012",
    role: "USER",
    createdAt: "2025-04-15",
    status: "active",
  },
  {
    id: "usr-010",
    full_name: "Puja Shrestha",
    email: "puja.shrestha@gmail.com",
    phone: "+977-986-789-0123",
    role: "USER",
    createdAt: "2025-05-02",
    status: "inactive",
  },
  {
    id: "usr-011",
    full_name: "Kamala Tamang",
    email: "kamala.tamang@gmail.com",
    phone: "+977-987-890-1234",
    role: "USER",
    createdAt: "2025-05-20",
    status: "active",
  },
  {
    id: "usr-012",
    full_name: "Sangita Limbu",
    email: "sangita.limbu@gmail.com",
    phone: "+977-988-901-2345",
    role: "USER",
    createdAt: "2025-06-01",
    status: "active",
  },
]

export const MOCK_SOS_ALERTS: MockSosAlert[] = [
  {
    id: "SOS-2847",
    victim: "Priya Sharma",
    age: 24,
    bloodType: "B+",
    phone: "+977-981-234-5678",
    location: "Thamel, Kathmandu",
    district: "Kathmandu",
    ward: "Ward 26",
    address: "Thamel Marg, Kathmandu Metropolitan City",
    lat: 27.7172,
    lng: 85.324,
    priority: "CRITICAL",
    status: "Active",
    triggeredAt: "2025-06-09T07:38:12",
    timeAgo: "3 min ago",
    timeline: [
      { time: "07:38:12", description: "Double-tap on wristband" },
      { time: "07:38:14", description: "GPS lock acquired (Thamel, Kathmandu)" },
      { time: "07:38:16", description: "Victim profile pushed to police dashboard" },
      { time: "07:38:18", description: "Family notified (3 contacts)" },
      { time: "07:38:22", description: "Audio evidence recording started" },
      { time: "07:39:05", description: "Unit 12 acknowledged dispatch" },
    ],
    emergencyContacts: [
      { relation: "Father", name: "Ram Sharma", phone: "+977-981-111-1111", notified: true },
      { relation: "Mother", name: "Laxmi Sharma", phone: "+977-981-222-2222", notified: true },
      { relation: "Brother", name: "Raj Sharma", phone: "+977-981-333-3333", notified: true },
    ],
    assignedUnit: { name: "Unit 12", officer: "SI Prakash Adhikari", vehicle: "NP-01-GA-1234", status: "Dispatched" },
  },
  {
    id: "SOS-2846",
    victim: "Maya Gurung",
    age: 28,
    bloodType: "O+",
    phone: "+977-982-345-6789",
    location: "Lakeside, Pokhara",
    district: "Kaski",
    ward: "Ward 6",
    address: "Lakeside Road, Pokhara",
    lat: 28.2096,
    lng: 83.9856,
    priority: "HIGH",
    status: "Dispatched",
    triggeredAt: "2025-06-09T07:25:00",
    timeAgo: "16 min ago",
    timeline: [
      { time: "07:25:00", description: "Double-tap on wristband" },
      { time: "07:25:03", description: "GPS lock acquired (Lakeside, Pokhara)" },
      { time: "07:25:08", description: "Unit 7 dispatched" },
    ],
    emergencyContacts: [
      { relation: "Father", name: "Hari Gurung", phone: "+977-982-111-1111", notified: true },
      { relation: "Mother", name: "Devi Gurung", phone: "+977-982-222-2222", notified: true },
    ],
    assignedUnit: { name: "Unit 7", officer: "ASI Kamal Rai", vehicle: "NP-04-GA-5678", status: "En Route" },
  },
  {
    id: "SOS-2845",
    victim: "Sita Rai",
    age: 22,
    bloodType: "A+",
    phone: "+977-983-456-7890",
    location: "Patan, Lalitpur",
    district: "Lalitpur",
    ward: "Ward 15",
    address: "Patan Durbar Square area",
    lat: 27.6729,
    lng: 85.326,
    priority: "HIGH",
    status: "Active",
    triggeredAt: "2025-06-09T07:30:00",
    timeAgo: "11 min ago",
    timeline: [
      { time: "07:30:00", description: "Double-tap on wristband" },
      { time: "07:30:02", description: "GPS lock acquired (Patan, Lalitpur)" },
    ],
    emergencyContacts: [
      { relation: "Father", name: "Gopal Rai", phone: "+977-983-111-1111", notified: true },
    ],
  },
  {
    id: "SOS-2844",
    victim: "Anita KC",
    age: 26,
    bloodType: "AB+",
    phone: "+977-984-567-8901",
    location: "Bhaktapur Durbar",
    district: "Bhaktapur",
    ward: "Ward 4",
    address: "Durbar Square, Bhaktapur",
    lat: 27.6727,
    lng: 85.4298,
    priority: "MEDIUM",
    status: "Dispatched",
    triggeredAt: "2025-06-09T07:15:00",
    timeAgo: "26 min ago",
    timeline: [
      { time: "07:15:00", description: "Double-tap on wristband" },
      { time: "07:15:05", description: "GPS lock acquired" },
    ],
    emergencyContacts: [
      { relation: "Mother", name: "Sita KC", phone: "+977-984-111-1111", notified: true },
    ],
    assignedUnit: { name: "Unit 3", officer: "SI Bikash Shrestha", vehicle: "NP-03-GA-9012", status: "On Scene" },
  },
  {
    id: "SOS-2843",
    victim: "Rupa Thapa",
    age: 30,
    bloodType: "B-",
    phone: "+977-985-678-9012",
    location: "Bharatpur, Chitwan",
    district: "Chitwan",
    ward: "Ward 10",
    address: "Narayangadh, Bharatpur",
    lat: 27.6833,
    lng: 84.4333,
    priority: "MEDIUM",
    status: "Active",
    triggeredAt: "2025-06-09T07:20:00",
    timeAgo: "21 min ago",
    timeline: [
      { time: "07:20:00", description: "Double-tap on wristband" },
    ],
    emergencyContacts: [
      { relation: "Brother", name: "Suresh Thapa", phone: "+977-985-111-1111", notified: true },
    ],
  },
  {
    id: "SOS-2842",
    victim: "Puja Shrestha",
    age: 19,
    bloodType: "O-",
    phone: "+977-986-789-0123",
    location: "Biratnagar, Morang",
    district: "Morang",
    ward: "Ward 8",
    address: "Main Road, Biratnagar",
    lat: 26.4525,
    lng: 87.2718,
    priority: "LOW",
    status: "Resolved",
    triggeredAt: "2025-06-09T06:45:00",
    timeAgo: "56 min ago",
    timeline: [
      { time: "06:45:00", description: "Double-tap on wristband" },
      { time: "06:52:00", description: "Case resolved — false alarm" },
    ],
    emergencyContacts: [],
  },
  {
    id: "SOS-2841",
    victim: "Kamala Tamang",
    age: 35,
    bloodType: "A-",
    phone: "+977-987-890-1234",
    location: "Dharan, Sunsari",
    district: "Sunsari",
    ward: "Ward 5",
    address: "Bhanu Chowk, Dharan",
    lat: 26.8144,
    lng: 87.279,
    priority: "MEDIUM",
    status: "Resolved",
    triggeredAt: "2025-06-09T06:30:00",
    timeAgo: "1 hr ago",
    timeline: [
      { time: "06:30:00", description: "Double-tap on wristband" },
      { time: "06:38:00", description: "Unit arrived on scene" },
      { time: "06:45:00", description: "Case resolved" },
    ],
    emergencyContacts: [
      { relation: "Father", name: "Pasang Tamang", phone: "+977-987-111-1111", notified: true },
    ],
  },
]

export const MOCK_CASES: MockCase[] = [
  {
    id: "CASE-1047",
    victim: "Priya Sharma",
    district: "Kathmandu",
    province: "Bagmati",
    officer: "SI Prakash Adhikari",
    status: "OPEN",
    priority: "CRITICAL",
    openedAt: "2025-06-09T07:38:12",
    timeSince: "3 min",
    evidenceCount: 3,
    evidenceFiles: ["audio_sos-2847.aes", "gps_log_2847.json", "timeline_2847.pdf"],
    notes: [],
    statusHistory: [{ status: "OPEN", timestamp: "2025-06-09T07:38:12" }],
  },
  {
    id: "CASE-1046",
    victim: "Maya Gurung",
    district: "Kaski",
    province: "Gandaki",
    officer: "ASI Kamal Rai",
    status: "INVESTIGATING",
    priority: "HIGH",
    openedAt: "2025-06-09T07:25:00",
    timeSince: "16 min",
    evidenceCount: 2,
    evidenceFiles: ["audio_sos-2846.aes", "gps_log_2846.json"],
    notes: ["Officer en route to Lakeside"],
    statusHistory: [
      { status: "OPEN", timestamp: "2025-06-09T07:25:00" },
      { status: "INVESTIGATING", timestamp: "2025-06-09T07:28:00" },
    ],
  },
  {
    id: "CASE-1045",
    victim: "Sita Rai",
    district: "Lalitpur",
    province: "Bagmati",
    officer: "Unassigned",
    status: "OPEN",
    priority: "HIGH",
    openedAt: "2025-06-09T07:30:00",
    timeSince: "11 min",
    evidenceCount: 1,
    evidenceFiles: ["gps_log_2845.json"],
    notes: [],
    statusHistory: [{ status: "OPEN", timestamp: "2025-06-09T07:30:00" }],
  },
  {
    id: "CASE-1044",
    victim: "Anita KC",
    district: "Bhaktapur",
    province: "Bagmati",
    officer: "SI Bikash Shrestha",
    status: "INVESTIGATING",
    priority: "MEDIUM",
    openedAt: "2025-06-09T07:15:00",
    timeSince: "26 min",
    evidenceCount: 2,
    evidenceFiles: ["audio_sos-2844.aes", "gps_log_2844.json"],
    notes: [],
    statusHistory: [
      { status: "OPEN", timestamp: "2025-06-09T07:15:00" },
      { status: "INVESTIGATING", timestamp: "2025-06-09T07:20:00" },
    ],
  },
  {
    id: "CASE-1043",
    victim: "Rupa Thapa",
    district: "Chitwan",
    province: "Bagmati",
    officer: "ASI Ramesh Poudel",
    status: "OPEN",
    priority: "MEDIUM",
    openedAt: "2025-06-09T07:20:00",
    timeSince: "21 min",
    evidenceCount: 1,
    evidenceFiles: ["gps_log_2843.json"],
    notes: [],
    statusHistory: [{ status: "OPEN", timestamp: "2025-06-09T07:20:00" }],
  },
  {
    id: "CASE-1042",
    victim: "Puja Shrestha",
    district: "Morang",
    province: "Province 1",
    officer: "SI Dipak Limbu",
    status: "CLOSED",
    priority: "LOW",
    openedAt: "2025-06-09T06:45:00",
    timeSince: "56 min",
    evidenceCount: 1,
    evidenceFiles: ["gps_log_2842.json"],
    notes: ["False alarm — victim confirmed safe"],
    statusHistory: [
      { status: "OPEN", timestamp: "2025-06-09T06:45:00" },
      { status: "CLOSED", timestamp: "2025-06-09T06:52:00" },
    ],
  },
  {
    id: "CASE-1041",
    victim: "Kamala Tamang",
    district: "Sunsari",
    province: "Province 1",
    officer: "ASI Hari Magar",
    status: "CLOSED",
    priority: "MEDIUM",
    openedAt: "2025-06-09T06:30:00",
    timeSince: "1 hr",
    evidenceCount: 2,
    evidenceFiles: ["audio_sos-2841.aes", "gps_log_2841.json"],
    notes: ["Resolved successfully"],
    statusHistory: [
      { status: "OPEN", timestamp: "2025-06-09T06:30:00" },
      { status: "INVESTIGATING", timestamp: "2025-06-09T06:35:00" },
      { status: "CLOSED", timestamp: "2025-06-09T06:45:00" },
    ],
  },
  {
    id: "CASE-1040",
    victim: "Sangita Limbu",
    district: "Jhapa",
    province: "Province 1",
    officer: "SI Manoj Karki",
    status: "ESCALATED",
    priority: "CRITICAL",
    openedAt: "2025-06-08T22:00:00",
    timeSince: "10 hr",
    evidenceCount: 4,
    evidenceFiles: ["audio_sos-2840.aes", "gps_log_2840.json", "timeline_2840.pdf", "witness_2840.aes"],
    notes: ["Escalated to provincial HQ"],
    statusHistory: [
      { status: "OPEN", timestamp: "2025-06-08T22:00:00" },
      { status: "INVESTIGATING", timestamp: "2025-06-08T22:15:00" },
      { status: "ESCALATED", timestamp: "2025-06-09T01:00:00" },
    ],
  },
  {
    id: "CASE-1039",
    victim: "Rekha Bhandari",
    district: "Rupandehi",
    province: "Lumbini",
    officer: "ASI Govinda Thapa",
    status: "INVESTIGATING",
    priority: "HIGH",
    openedAt: "2025-06-08T18:30:00",
    timeSince: "13 hr",
    evidenceCount: 2,
    evidenceFiles: ["audio_sos-2839.aes", "gps_log_2839.json"],
    notes: [],
    statusHistory: [
      { status: "OPEN", timestamp: "2025-06-08T18:30:00" },
      { status: "INVESTIGATING", timestamp: "2025-06-08T18:45:00" },
    ],
  },
  {
    id: "CASE-1038",
    victim: "Laxmi Yadav",
    district: "Dhanusha",
    province: "Madhesh",
    officer: "SI Ram Bahadur",
    status: "CLOSED",
    priority: "MEDIUM",
    openedAt: "2025-06-07T14:00:00",
    timeSince: "2 days",
    evidenceCount: 1,
    evidenceFiles: ["gps_log_2838.json"],
    notes: ["Case closed — victim safe"],
    statusHistory: [
      { status: "OPEN", timestamp: "2025-06-07T14:00:00" },
      { status: "CLOSED", timestamp: "2025-06-07T15:30:00" },
    ],
  },
]

export const MOCK_UNITS: MockUnit[] = [
  { id: "UNIT-01", province: "Bagmati", zone: "Kathmandu Valley", officer: "SI Prakash Adhikari", vehicle: "NP-01-GA-1234", status: "dispatched", activeCase: "SOS-2847", lastUpdated: "2 min ago" },
  { id: "UNIT-02", province: "Bagmati", zone: "Kathmandu Valley", officer: "ASI Bikash Shrestha", vehicle: "NP-01-GA-2345", status: "on_scene", activeCase: "SOS-2844", lastUpdated: "5 min ago" },
  { id: "UNIT-03", province: "Bagmati", zone: "Kathmandu Valley", officer: "HC Ram Thapa", vehicle: "NP-01-GA-3456", status: "available", lastUpdated: "1 min ago" },
  { id: "UNIT-04", province: "Gandaki", zone: "Pokhara", officer: "ASI Kamal Rai", vehicle: "NP-04-GA-5678", status: "dispatched", activeCase: "SOS-2846", lastUpdated: "3 min ago" },
  { id: "UNIT-05", province: "Gandaki", zone: "Pokhara", officer: "SI Anil Gurung", vehicle: "NP-04-GA-6789", status: "available", lastUpdated: "10 min ago" },
  { id: "UNIT-06", province: "Province 1", zone: "Biratnagar", officer: "SI Dipak Limbu", vehicle: "NP-01-PR-1111", status: "available", lastUpdated: "8 min ago" },
  { id: "UNIT-07", province: "Province 1", zone: "Dharan", officer: "ASI Hari Magar", vehicle: "NP-01-PR-2222", status: "available", lastUpdated: "15 min ago" },
  { id: "UNIT-08", province: "Province 1", zone: "Jhapa", officer: "SI Manoj Karki", vehicle: "NP-01-PR-3333", status: "on_scene", activeCase: "SOS-2840", lastUpdated: "4 min ago" },
  { id: "UNIT-09", province: "Lumbini", zone: "Butwal", officer: "ASI Govinda Thapa", vehicle: "NP-05-GA-4444", status: "dispatched", activeCase: "CASE-1039", lastUpdated: "6 min ago" },
  { id: "UNIT-10", province: "Lumbini", zone: "Bharatpur", officer: "ASI Ramesh Poudel", vehicle: "NP-05-GA-5555", status: "dispatched", activeCase: "SOS-2843", lastUpdated: "7 min ago" },
  { id: "UNIT-11", province: "Madhesh", zone: "Janakpur", officer: "SI Ram Bahadur", vehicle: "NP-02-MD-6666", status: "available", lastUpdated: "20 min ago" },
  { id: "UNIT-12", province: "Karnali", zone: "Surkhet", officer: "ASI Tek Bahadur", vehicle: "NP-06-KR-7777", status: "offline", lastUpdated: "2 hr ago" },
  { id: "UNIT-13", province: "Sudurpaschim", zone: "Dhangadhi", officer: "SI Krishna Oli", vehicle: "NP-07-SP-8888", status: "available", lastUpdated: "12 min ago" },
  { id: "UNIT-14", province: "Sudurpaschim", zone: "Mahendranagar", officer: "HC Surya Bhandari", vehicle: "NP-07-SP-9999", status: "offline", lastUpdated: "45 min ago" },
]

export const MOCK_AUDIT_LOG: MockAuditEntry[] = [
  { id: "aud-001", timestamp: "2025-06-09 07:41:22", admin: "Ujwal Bholan", action: "LOGIN", target: "—", ipAddress: "192.168.1.1", result: "Success" },
  { id: "aud-002", timestamp: "2025-06-09 07:45:11", admin: "Ujwal Bholan", action: "CREATE_USER", target: "maya@gmail.com", ipAddress: "192.168.1.1", result: "Success" },
  { id: "aud-003", timestamp: "2025-06-09 07:50:03", admin: "Ujwal Bholan", action: "UPDATE_CASE", target: "SOS-2847", ipAddress: "192.168.1.1", result: "Success" },
  { id: "aud-004", timestamp: "2025-06-09 08:01:55", admin: "Ujwal Bholan", action: "DELETE_USER", target: "old@user.com", ipAddress: "192.168.1.1", result: "Success" },
  { id: "aud-005", timestamp: "2025-06-09 08:15:30", admin: "Aarav Sharma", action: "LOGIN", target: "—", ipAddress: "10.0.0.45", result: "Success" },
  { id: "aud-006", timestamp: "2025-06-09 08:22:18", admin: "Aarav Sharma", action: "UPDATE_USER", target: "priya.sharma@gmail.com", ipAddress: "10.0.0.45", result: "Success" },
  { id: "aud-007", timestamp: "2025-06-09 08:30:00", admin: "Ujwal Bholan", action: "UPDATE_CASE", target: "CASE-1046", ipAddress: "192.168.1.1", result: "Success" },
  { id: "aud-008", timestamp: "2025-06-09 09:00:12", admin: "Ujwal Bholan", action: "CREATE_USER", target: "binod@nepalpolice.gov.np", ipAddress: "192.168.1.1", result: "Success" },
  { id: "aud-009", timestamp: "2025-06-09 09:15:45", admin: "Aarav Sharma", action: "LOGOUT", target: "—", ipAddress: "10.0.0.45", result: "Success" },
  { id: "aud-010", timestamp: "2025-06-09 09:30:00", admin: "Ujwal Bholan", action: "UPDATE_CASE", target: "CASE-1040", ipAddress: "192.168.1.1", result: "Success" },
  { id: "aud-011", timestamp: "2025-06-09 10:00:00", admin: "Ujwal Bholan", action: "DELETE_USER", target: "inactive@test.com", ipAddress: "192.168.1.1", result: "Failed" },
  { id: "aud-012", timestamp: "2025-06-09 10:15:22", admin: "Ujwal Bholan", action: "CREATE_USER", target: "sangita.limbu@gmail.com", ipAddress: "192.168.1.1", result: "Success" },
  { id: "aud-013", timestamp: "2025-06-09 11:00:00", admin: "Aarav Sharma", action: "LOGIN", target: "—", ipAddress: "10.0.0.45", result: "Success" },
  { id: "aud-014", timestamp: "2025-06-09 11:30:15", admin: "Aarav Sharma", action: "UPDATE_USER", target: "anita.kc@outlook.com", ipAddress: "10.0.0.45", result: "Success" },
  { id: "aud-015", timestamp: "2025-06-09 12:00:00", admin: "Ujwal Bholan", action: "UPDATE_CASE", target: "SOS-2845", ipAddress: "192.168.1.1", result: "Success" },
  { id: "aud-016", timestamp: "2025-06-08 18:00:00", admin: "Ujwal Bholan", action: "LOGIN", target: "—", ipAddress: "192.168.1.1", result: "Success" },
  { id: "aud-017", timestamp: "2025-06-08 20:30:00", admin: "Ujwal Bholan", action: "CREATE_USER", target: "sunita.karki@health.gov.np", ipAddress: "192.168.1.1", result: "Success" },
  { id: "aud-018", timestamp: "2025-06-08 22:00:00", admin: "Ujwal Bholan", action: "UPDATE_CASE", target: "CASE-1040", ipAddress: "192.168.1.1", result: "Success" },
  { id: "aud-019", timestamp: "2025-06-07 14:00:00", admin: "Aarav Sharma", action: "UPDATE_CASE", target: "CASE-1038", ipAddress: "10.0.0.45", result: "Success" },
  { id: "aud-020", timestamp: "2025-06-07 16:30:00", admin: "Ujwal Bholan", action: "LOGOUT", target: "—", ipAddress: "192.168.1.1", result: "Success" },
]

export const NEPAL_PROVINCES = [
  "Bagmati", "Gandaki", "Province 1", "Lumbini", "Madhesh", "Karnali", "Sudurpaschim",
]

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function generateSosChartData() {
  const data = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const base = isWeekend ? 8 : 4
    const count = base + Math.floor(Math.random() * 6)
    data.push({
      date: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      count,
    })
  }
  return data
}

export const USER_ROLE_BREAKDOWN = [
  { role: "USER", count: 1180, color: "#C0392B" },
  { role: "POLICE", count: 42, color: "#3B82F6" },
  { role: "GUARDIAN", count: 18, color: "#EAB308" },
  { role: "ADMIN", count: 6, color: "#A855F7" },
  { role: "SUPER_ADMIN", count: 1, color: "#FFFFFF" },
]

export const LATEST_REGISTERED_USERS = MOCK_USERS.slice(-5).reverse().map((u) => ({
  ...u,
  timeAgo: u.createdAt === "2025-06-01" ? "8 days ago" : u.createdAt === "2025-05-20" ? "20 days ago" : "Recently",
}))

export const DASHBOARD_SOS_ROWS = MOCK_SOS_ALERTS.slice(0, 5).map((a) => ({
  id: a.id,
  time: a.timeAgo,
  victim: a.victim,
  location: a.location,
  priority: a.priority,
  status: a.status,
}))
