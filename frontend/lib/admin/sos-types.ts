export type SosPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
export type SosStatus = "Active" | "Dispatched" | "Resolved"

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

export interface AdminSosAlert {
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
  triggerNotes?: string | null
  imei?: string
  assignedUnit?: {
    name: string
    officer: string
    vehicle: string
    status: string
  }
}
