export interface ApiErrorBody {
  message?: string
  error?: string
  statusCode?: number
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface RegisterResponse {
  id: number
  email: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthUser {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
}

export interface LoginResponse {
  message: string
  user: AuthUser
  accessToken: string
  refreshToken: string
}

export interface PoliceStation {
  id: string
  name: string
  address: string
  contact_number: string
}

export interface PoliceStationsResponse {
  message: string
  stations: PoliceStation[]
}

export interface CreatePoliceStationPayload {
  name: string
  address: string
  contact_number: string
}

export interface InvitePoliceOfficerPayload {
  full_name: string
  email: string
  phone: string
  station_id: string
}

export interface InvitePoliceOfficerResponse {
  message: string
  email: string
  user_id: string
}

export interface PoliceSetupMessageResponse {
  message: string
}

export interface PoliceDashboardResponse {
  activeSosEvents: number
  totalDevices: number
  totalUsers: number
  sosEventsToday: number
  pingsToday: number
  resolvedToday: Array<{
    id: string
    deviceImei: string
    startedAt: string
    resolvedAt: string | null
  }>
}

export interface PoliceSosEventSummary {
  id: string
  deviceId: string
  userId: string | null
  imei: string
  label: string | null
  status: string
  eventType?: string | null
  latitude?: number | null
  longitude?: number | null
  triggerNotes?: string | null
  assignedStationId?: string | null
  assignedStationName?: string | null
  startedAt: string
  resolvedAt?: string | null
  lastLocation: {
    latitude: number
    longitude: number
    recordedAt: string
  } | null
}

export interface SosSocketEvent {
  id: string
  deviceId: string
  deviceImei?: string
  eventType: string
  status: string
  latitude?: number
  longitude?: number
  altitudeM?: number
  speedKmph?: number
  satellites?: number
  startedAt: string
  resolvedAt?: string
  triggerNotes?: string
  assignedStationId?: string
  assignedStationName?: string
  latestPing?: {
    latitude: number
    longitude: number
    recordedAt: string
  } | null
}

export interface GuardianWard {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
}

export interface GuardianWardsResponse {
  message: string
  wards: GuardianWard[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface GuardianWardSosEvent {
  id: string
  deviceId: string
  imei: string
  label: string | null
  status: string
  eventType: string | null
  latitude: number | null
  longitude: number | null
  triggerNotes: string | null
  assignedStationId: string | null
  assignedStationName: string | null
  startedAt: string
  resolvedAt: string | null
  lastLocation: {
    latitude: number
    longitude: number
    recordedAt: string
  } | null
}

export interface GuardianWardSosResponse {
  message: string
  wardId: string
  data: GuardianWardSosEvent[]
  total: number
}

export interface PoliceSosEventsResponse {
  data: PoliceSosEventSummary[]
  total: number
}

export interface PoliceGuardian {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
  created_at: string
}

export interface PoliceUserInfo {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
}

export interface PoliceDeviceLocationResponse {
  device: { id: string; imei: string; label: string | null }
  lastLocation: {
    id: string
    latitude: number
    longitude: number
    altitudeM?: number | null
    speedKmph?: number | null
    satellites?: number | null
    recordedAt: string
  } | null
}

export interface LiveEmergencyUser {
  id: string
  fullName: string
  phone: string
}

export interface LiveEmergencyLastLocation {
  latitude: number
  longitude: number
  recordedAt: string
}

export interface LiveEmergencyEvent {
  id: string
  deviceId: string
  userId: string | null
  imei: string
  label: string | null
  eventType: string | null
  status: string
  latitude: number | null
  longitude: number | null
  altitudeM: number | null
  triggerNotes: string | null
  assignedStationId: string | null
  assignedStationName: string | null
  startedAt: string
  resolvedAt: string | null
  user: LiveEmergencyUser | null
  lastLocation: LiveEmergencyLastLocation | null
}

export interface EmergencyLiveResponse {
  data: LiveEmergencyEvent[]
  total: number
}

export interface AdminSosEventDevice {
  id: string
  imei: string
  label: string | null
}

export interface AdminSosEventRecord {
  id: string
  status: "active" | "resolved"
  eventType?: string | null
  latitude?: number | null
  longitude?: number | null
  triggerNotes?: string | null
  notes?: string | null
  startedAt: string
  resolvedAt?: string | null
  device: AdminSosEventDevice
}

export interface AdminSosEventsResponse {
  data: AdminSosEventRecord[]
  total: number
  page: number
  limit: number
  totalPages: number
}
