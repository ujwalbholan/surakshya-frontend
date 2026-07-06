export interface LocationUpdatePayload {
  id: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  altitudeM?: number;
  speedKmph?: number;
  satellites?: number;
  hdop?: number;
  recordedAt: string;
}

export interface SosEventPayload {
  id: string;
  deviceId: string;
  deviceImei?: string;
  eventType: string;
  status: string;
  latitude?: number;
  longitude?: number;
  altitudeM?: number;
  speedKmph?: number;
  satellites?: number;
  startedAt: string;
  resolvedAt?: string;
  latestPing?: {
    latitude: number;
    longitude: number;
    recordedAt: string;
  } | null;
}
