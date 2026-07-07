export type AlertStatus = "critical" | "responding" | "resolved"
export type AlertPriority = "high" | "medium" | "low"
export type FamilyRelation = "father" | "mother" | "brother" | "sister"

export interface EmergencyContact {
  relation: FamilyRelation
  name: string
  phone: string
}

export interface VictimProfile {
  fullName: string
  age: number
  phone: string
  bloodType: string
  photoUrl: string
  emergencyContacts: EmergencyContact[]
}

export interface LiveLocation {
  lat: number
  lng: number
  address: string
  lastUpdated: string
  accuracyMeters: number
}

export interface SosAlert {
  id: string
  citizen: string
  district: string
  ward: string
  location: string
  coordinates: string
  triggeredAt: string
  status: AlertStatus
  priority: AlertPriority
  unit?: string
  /** Triggered by double-tap on Suraksha wristband sensor */
  triggerType: "double_tap"
  victim: VictimProfile
  liveLocation: LiveLocation
  deviceId?: string
  userId?: string
}

export interface DashboardStat {
  label: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
}

export const dashboardStats: DashboardStat[] = [
  { label: "Active SOS", value: "7", change: "+2 last hour", trend: "up" },
  { label: "Resolved Today", value: "23", change: "Bagmati Province", trend: "neutral" },
  { label: "Avg Response", value: "4.2 min", change: "−18% vs yesterday", trend: "down" },
  { label: "Units Deployed", value: "14", change: "Kathmandu Valley", trend: "neutral" },
]

export const sosAlerts: SosAlert[] = [
  {
    id: "SOS-2847",
    citizen: "Priya Sharma",
    district: "Kathmandu",
    ward: "Ward 26",
    location: "Thamel, Kathmandu",
    coordinates: "27.7154° N, 85.3123° E",
    triggeredAt: "2 min ago",
    status: "critical",
    priority: "high",
    triggerType: "double_tap",
    victim: {
      fullName: "Priya Sharma",
      age: 24,
      phone: "+977 984-1234567",
      bloodType: "B+",
      photoUrl: "/images/social-1.jpg",
      emergencyContacts: [
        { relation: "father", name: "Ram Sharma", phone: "+977 981-2345678" },
        { relation: "mother", name: "Sita Sharma", phone: "+977 982-3456789" },
        { relation: "brother", name: "Rajan Sharma", phone: "+977 980-4567890" },
      ],
    },
    liveLocation: {
      lat: 27.7154,
      lng: 85.3123,
      address: "Thamel, Kathmandu 44600",
      lastUpdated: "Just now",
      accuracyMeters: 8,
    },
  },
  {
    id: "SOS-2846",
    citizen: "Ananya Karki",
    district: "Lalitpur",
    ward: "Ward 3",
    location: "Pulchowk, Lalitpur",
    coordinates: "27.6768° N, 85.3165° E",
    triggeredAt: "8 min ago",
    status: "responding",
    priority: "high",
    unit: "Unit 12 — Metro",
    triggerType: "double_tap",
    victim: {
      fullName: "Ananya Karki",
      age: 28,
      phone: "+977 985-1122334",
      bloodType: "O+",
      photoUrl: "/images/social-2.jpg",
      emergencyContacts: [
        { relation: "father", name: "Krishna Karki", phone: "+977 981-9988776" },
        { relation: "mother", name: "Laxmi Karki", phone: "+977 982-8877665" },
        { relation: "sister", name: "Puja Karki", phone: "+977 980-7766554" },
      ],
    },
    liveLocation: {
      lat: 27.6768,
      lng: 85.3165,
      address: "Pulchowk, Lalitpur 44700",
      lastUpdated: "8 sec ago",
      accuracyMeters: 12,
    },
  },
  {
    id: "SOS-2845",
    citizen: "Meera Thapa",
    district: "Kaski",
    ward: "Ward 8",
    location: "Lakeside, Pokhara",
    coordinates: "28.2096° N, 83.9856° E",
    triggeredAt: "14 min ago",
    status: "responding",
    priority: "medium",
    unit: "Unit 4 — Western",
    triggerType: "double_tap",
    victim: {
      fullName: "Meera Thapa",
      age: 31,
      phone: "+977 986-5544332",
      bloodType: "A+",
      photoUrl: "/images/social-3.jpg",
      emergencyContacts: [
        { relation: "mother", name: "Maya Thapa", phone: "+977 981-2233445" },
        { relation: "brother", name: "Bikash Thapa", phone: "+977 980-3344556" },
      ],
    },
    liveLocation: {
      lat: 28.2096,
      lng: 83.9856,
      address: "Lakeside, Pokhara 33700",
      lastUpdated: "22 sec ago",
      accuracyMeters: 15,
    },
  },
  {
    id: "SOS-2844",
    citizen: "Sunita Rai",
    district: "Morang",
    ward: "Ward 5",
    location: "Biratnagar Chowk",
    coordinates: "26.4525° N, 87.2718° E",
    triggeredAt: "31 min ago",
    status: "resolved",
    priority: "medium",
    unit: "Unit 7 — Eastern",
    triggerType: "double_tap",
    victim: {
      fullName: "Sunita Rai",
      age: 26,
      phone: "+977 984-6677889",
      bloodType: "AB+",
      photoUrl: "/images/philosophy.jpg",
      emergencyContacts: [
        { relation: "father", name: "Hari Rai", phone: "+977 981-5566778" },
        { relation: "sister", name: "Kamala Rai", phone: "+977 982-4455667" },
      ],
    },
    liveLocation: {
      lat: 26.4525,
      lng: 87.2718,
      address: "Biratnagar Chowk, Morang",
      lastUpdated: "31 min ago",
      accuracyMeters: 10,
    },
  },
  {
    id: "SOS-2843",
    citizen: "Rina Gurung",
    district: "Bhaktapur",
    ward: "Ward 10",
    location: "Durbar Square Area",
    coordinates: "27.6710° N, 85.4298° E",
    triggeredAt: "48 min ago",
    status: "resolved",
    priority: "low",
    unit: "Unit 9 — Valley",
    triggerType: "double_tap",
    victim: {
      fullName: "Rina Gurung",
      age: 22,
      phone: "+977 980-3210987",
      bloodType: "B−",
      photoUrl: "/images/craft.jpg",
      emergencyContacts: [
        { relation: "mother", name: "Pasang Gurung", phone: "+977 981-2109876" },
      ],
    },
    liveLocation: {
      lat: 27.671,
      lng: 85.4298,
      address: "Durbar Square Area, Bhaktapur",
      lastUpdated: "48 min ago",
      accuracyMeters: 9,
    },
  },
]

export const provinceCoverage = [
  { province: "Bagmati", active: 4, units: 6 },
  { province: "Gandaki", active: 1, units: 2 },
  { province: "Koshi", active: 1, units: 2 },
  { province: "Madhesh", active: 0, units: 2 },
  { province: "Lumbini", active: 1, units: 2 },
]

export const recentActivity = [
  { time: "07:42 NPT", text: "Double-tap SOS — Priya Sharma, Thamel (SOS-2847)" },
  { time: "07:38 NPT", text: "Live GPS streaming — Ananya Karki, Pulchowk" },
  { time: "07:31 NPT", text: "SOS-2844 marked resolved — Biratnagar" },
  { time: "07:18 NPT", text: "Unit 4 dispatched — Meera Thapa, Pokhara" },
  { time: "07:05 NPT", text: "Daily briefing synced — Nepal Police HQ" },
]

export const relationLabels: Record<FamilyRelation, string> = {
  father: "Father",
  mother: "Mother",
  brother: "Brother",
  sister: "Sister",
}

export function mapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`
}
