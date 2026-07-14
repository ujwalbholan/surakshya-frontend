export interface ApiErrorBody {
  message?: string
  error?: string
  statusCode?: number
  code?: string
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

/** First login with temporary password (police or guardian). */
export interface PasswordChallengeResponse {
  message: string
  requiresPasswordChange: true
  challengeToken: string
  role?: "POLICE" | "GUARDIAN"
}

/** Password already changed; OTP still required to activate. */
export interface OtpResumeResponse {
  message: string
  requiresActivationOtp: true
  challengeToken: string
  role?: "POLICE" | "GUARDIAN"
}

export type LoginChallengeResponse =
  | PasswordChallengeResponse
  | OtpResumeResponse

/** @deprecated Prefer LoginChallengeResponse */
export type PolicePasswordChallengeResponse = PasswordChallengeResponse
/** @deprecated Prefer LoginChallengeResponse */
export type PoliceOtpResumeResponse = OtpResumeResponse
/** @deprecated Prefer LoginChallengeResponse */
export type PoliceLoginChallengeResponse = LoginChallengeResponse

export type LoginResult = LoginResponse | LoginChallengeResponse

export function isLoginChallenge(
  value: LoginResult
): value is LoginChallengeResponse {
  return (
    ("requiresPasswordChange" in value && value.requiresPasswordChange === true) ||
    ("requiresActivationOtp" in value && value.requiresActivationOtp === true)
  )
}

/** @deprecated Prefer isLoginChallenge */
export function isPoliceLoginChallenge(
  value: LoginResult
): value is LoginChallengeResponse {
  return isLoginChallenge(value)
}

export interface ActivationPasswordResponse {
  message: string
  otpSent: boolean
}

export interface ActivationVerifyResponse {
  message: string
}

/** @deprecated Prefer ActivationPasswordResponse */
export type PoliceActivationPasswordResponse = ActivationPasswordResponse
/** @deprecated Prefer ActivationVerifyResponse */
export type PoliceActivationVerifyResponse = ActivationVerifyResponse

export interface PoliceStation {
  id: string
  name: string
  address: string
  contact_number: string
  latitude?: number | null
  longitude?: number | null
  place_id?: string | null
  formatted_address?: string | null
}

export interface PoliceStationsResponse {
  message: string
  stations: PoliceStation[]
}

export interface CreatePoliceStationPayload {
  name: string
  address: string
  contact_number: string
  latitude?: number
  longitude?: number
  place_id?: string
  formatted_address?: string
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

export interface PendingStationLinkOfficer {
  id: string
  full_name: string
  email: string
  phone: string
}

export interface PendingStationLinkStation {
  id: string
  name: string
  address: string
}

export interface PendingStationLinkRequester {
  id: string
  full_name: string
  email: string
}

export interface PendingStationLink {
  id: string
  officer: PendingStationLinkOfficer
  station: PendingStationLinkStation
  requested_by: PendingStationLinkRequester
  created_at: string
}

export interface PendingStationLinksResponse {
  message: string
  links: PendingStationLink[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApproveStationLinkResponse {
  message: string
  link_id: string
}

export interface RejectStationLinkResponse {
  message: string
  link_id: string
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
  userId?: string | null
  label?: string | null
  citizenName?: string | null
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

export type GuardianRequestDirection = "CHILD_TO_GUARDIAN" | "GUARDIAN_TO_CHILD"

export type GuardianRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED"

export interface GuardianLinkUser {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
}

export interface InviteGuardianPayload {
  full_name: string
  email: string
  phone: string
}

export interface InviteGuardianResponse {
  message: string
  request_id: string
  guardian: GuardianLinkUser
}

export interface MyGuardiansResponse {
  message: string
  guardians: GuardianLinkUser[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ChildPendingRequest {
  id: string
  target_name: string
  target_email: string
  direction: GuardianRequestDirection
  status: GuardianRequestStatus
  created_at: string
}

export interface ChildPendingRequestsResponse {
  message: string
  requests: ChildPendingRequest[]
}

export interface GuardianPendingRequest {
  id: string
  requester_name: string
  requester_id: string
  direction: GuardianRequestDirection
  status: GuardianRequestStatus
  created_at: string
}

export interface GuardianPendingRequestsResponse {
  message: string
  requests: GuardianPendingRequest[]
}

export interface GuardianLinkMessageResponse {
  message: string
}

export interface InviteWardPayload {
  child_email: string
}

export interface GuardianSetupMessageResponse {
  message: string
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

// ——— Cases ———

export interface ApiUserSummary {
  id: string
  full_name: string
  email: string
  phone: string
}

export interface ApiStationSummary {
  id: string
  name: string
}

export interface ApiUnitSummary {
  id: string
  name: string
  vehicle: string
  zone: string
}

export interface ApiCaseRecord {
  id: string
  case_number: string
  status: string
  priority: string
  summary: string
  district: string | null
  province: string | null
  victim_name: string | null
  sos_event_id: string | null
  station_id: string | null
  station: ApiStationSummary | null
  assigned_officer_id: string | null
  assigned_officer: ApiUserSummary | null
  assigned_unit_id: string | null
  assigned_unit: ApiUnitSummary | null
  opened_at: string
  closed_at: string | null
  created_at: string
  updated_at: string
}

export interface ApiCaseStatusHistory {
  id: string
  status: string
  changed_by_id: string | null
  changed_by: ApiUserSummary | null
  created_at: string
}

export interface ApiCaseNote {
  id: string
  body: string
  author_id: string | null
  author: ApiUserSummary | null
  created_at: string
}

export interface ApiCaseDetail extends ApiCaseRecord {
  status_history: ApiCaseStatusHistory[]
  notes: ApiCaseNote[]
}

export interface AdminCasesListResponse {
  message: string
  cases: ApiCaseRecord[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AdminCaseDetailResponse {
  message: string
  case: ApiCaseDetail
}

export interface AdminCaseStatusResponse {
  message: string
  case: ApiCaseDetail
}

export interface AdminCaseNoteResponse {
  message: string
  note: ApiCaseNote
}

export interface CreateCasePayload {
  summary: string
  priority?: string
  status?: string
  district?: string
  province?: string
  victim_name?: string
  sos_event_id?: string
  station_id?: string
  assigned_officer_id?: string
  assigned_unit_id?: string
}

export type UpdateCasePayload = Partial<CreateCasePayload>

// ——— Patrol units ———

export interface ApiPatrolUnitRecord {
  id: string
  name: string
  vehicle: string
  zone: string
  province: string
  status: string
  station_id: string | null
  station: ApiStationSummary | null
  lead_officer_id: string | null
  lead_officer: ApiUserSummary | null
  contact_phone: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string
}

export interface AdminPatrolUnitsListResponse {
  message: string
  units: ApiPatrolUnitRecord[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AdminPatrolUnitResponse {
  message: string
  unit: ApiPatrolUnitRecord
}

export interface CreatePatrolUnitPayload {
  name: string
  vehicle: string
  zone: string
  province: string
  status?: string
  station_id?: string
  lead_officer_id?: string
  contact_phone?: string
  latitude?: number
  longitude?: number
}

export type UpdatePatrolUnitPayload = Partial<CreatePatrolUnitPayload>

// ——— Evidence ———

export interface ApiEvidenceCaseSummary {
  id: string
  case_number: string
  status: string
  priority: string
  victim_name: string | null
  district: string | null
  province: string | null
  station_id: string | null
}

export interface ApiEvidenceRecord {
  id: string
  case_id: string
  case: ApiEvidenceCaseSummary | null
  file_name: string
  storage_key: string
  mime_type: string | null
  file_type: string
  size_bytes: string
  checksum: string
  uploaded_by_id: string
  uploaded_by: ApiUserSummary | null
  captured_at: string | null
  created_at: string
}

export interface AdminEvidenceListResponse {
  message: string
  evidence: ApiEvidenceRecord[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AdminEvidenceDetailResponse {
  message: string
  evidence: ApiEvidenceRecord
}

export interface CreateEvidencePayload {
  case_id: string
  file_name: string
  storage_key: string
  file_type: string
  size_bytes: number
  checksum: string
  mime_type?: string
  captured_at?: string
}

// ——— Audit ———

export interface ApiAuditLogRecord {
  id: string
  actor_user_id: string | null
  actor: ApiUserSummary | null
  actor_role: string
  action: string
  target_entity_type: string | null
  target_entity_id: string | null
  target_label: string | null
  ip_address: string | null
  result: string
  result_label: "Success" | "Failed"
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface AdminAuditListResponse {
  message: string
  audit_logs: ApiAuditLogRecord[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AdminAuditDetailResponse {
  message: string
  audit_log: ApiAuditLogRecord
}

// ——— Reports ———

export type ApiReportRange = "7d" | "30d" | "90d"

export interface AdminReportSummaryResponse {
  message: string
  range: ApiReportRange
  total_sos: number
  resolved_count: number
  avg_response_minutes: string
  resolution_rate: number
  active_cases: number
  units_dispatched: number
}

export interface AdminDailySeriesPoint {
  date: string
  sos: number
  resolved: number
  open: number
  escalated: number
  users: number
  minutes: number
}

export interface AdminDailySeriesResponse {
  message: string
  range: ApiReportRange
  series: AdminDailySeriesPoint[]
}

export interface AdminProvinceBreakdownRow {
  province: string
  total_sos: number
  resolved: number
  avg_response_minutes: number
  avg_response: string
  resolution_rate: number
  units: number
}

export interface AdminProvinceBreakdownResponse {
  message: string
  range: ApiReportRange
  provinces: AdminProvinceBreakdownRow[]
}

// ——— Police (cases, units, evidence, reports) ———

export interface PoliceCasesListResponse {
  message: string
  cases: ApiCaseRecord[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PoliceCaseDetailResponse {
  message: string
  case: ApiCaseDetail
}

export interface PolicePatrolUnitsListResponse {
  message: string
  units: ApiPatrolUnitRecord[]
  total: number
}

export interface PoliceEvidenceListResponse {
  message: string
  evidence: ApiEvidenceRecord[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PoliceEvidenceDetailResponse {
  message: string
  evidence: ApiEvidenceRecord
}

export interface PoliceReportSummaryResponse {
  message: string
  range: ApiReportRange
  total_sos: number
  resolved_count: number
  avg_response_minutes: string
  resolution_rate: number
  active_cases: number
  units_dispatched: number
}
