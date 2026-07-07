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
  startedAt: string
  resolvedAt?: string | null
  lastLocation: {
    latitude: number
    longitude: number
    recordedAt: string
  } | null
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
