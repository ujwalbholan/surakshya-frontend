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
  /** Triggered by double-tap on Surakshya wristband sensor */
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
