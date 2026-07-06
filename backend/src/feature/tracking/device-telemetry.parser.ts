export interface DeviceTelemetry {
  deviceId: string;
  uptimeMs?: number;
  wifi?: string;
  mqtt?: string;
  ip?: string;
  latitude?: number;
  longitude?: number;
  altitudeM?: number;
  speedKmph?: number;
  satellites?: number;
  hdop?: number;
  gpsUtc?: string;
  nmeaSentences: string[];
}

export function parseDeviceTelemetry(
  raw: string,
  fallbackDeviceId?: string,
): DeviceTelemetry | null {
  const nmeaSentences = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('$'));

  const deviceId =
    matchGroup(raw, /Device:\s*(\S+)/) ?? fallbackDeviceId ?? null;

  if (!deviceId) {
    return null;
  }

  const telemetry: DeviceTelemetry = {
    deviceId,
    uptimeMs: parseOptionalInt(matchGroup(raw, /Uptime:\s*(\d+)\s*ms/)),
    wifi: matchGroup(raw, /WiFi:\s*(\S+)/),
    mqtt: matchGroup(raw, /MQTT:\s*(\S+)/),
    ip: matchGroup(raw, /IP:\s*(\S+)/),
    latitude: parseOptionalFloat(matchGroup(raw, /Latitude:\s*([\d.-]+)/)),
    longitude: parseOptionalFloat(matchGroup(raw, /Longitude:\s*([\d.-]+)/)),
    altitudeM: parseOptionalFloat(matchGroup(raw, /Altitude:\s*([\d.-]+)\s*m/)),
    speedKmph: parseOptionalFloat(
      matchGroup(raw, /Speed:\s*([\d.-]+)\s*km\/h/),
    ),
    satellites: parseOptionalInt(matchGroup(raw, /GPS satellites:\s*(\d+)/)),
    hdop: parseOptionalFloat(matchGroup(raw, /GPS HDOP:\s*([\d.-]+)/)),
    gpsUtc: matchGroup(raw, /GPS UTC date\/time:\s*([^\n$]+)/)?.trim(),
    nmeaSentences,
  };

  if (telemetry.latitude == null || telemetry.longitude == null) {
    const fromNmea = extractFromNmea(nmeaSentences);
    if (fromNmea) {
      telemetry.latitude ??= fromNmea.latitude;
      telemetry.longitude ??= fromNmea.longitude;
      telemetry.speedKmph ??= fromNmea.speedKmph;
      telemetry.satellites ??= fromNmea.satellites;
      telemetry.hdop ??= fromNmea.hdop;
      telemetry.altitudeM ??= fromNmea.altitudeM;
    }
  }

  return telemetry;
}

function matchGroup(raw: string, pattern: RegExp): string | undefined {
  return pattern.exec(raw)?.[1];
}

function parseOptionalFloat(value: string | undefined): number | undefined {
  if (value == null) {
    return undefined;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalInt(value: string | undefined): number | undefined {
  if (value == null) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractFromNmea(sentences: string[]) {
  const gga = sentences.find((sentence) => sentence.startsWith('$GPGGA'));
  if (!gga) {
    return null;
  }

  const parts = gga.split(',');
  const latitude = nmeaToDecimal(parts[2], parts[3]);
  const longitude = nmeaToDecimal(parts[4], parts[5]);
  const satellites = parseOptionalInt(parts[7]);
  const hdop = parseOptionalFloat(parts[8]);
  const altitudeM = parseOptionalFloat(parts[9]);

  if (latitude == null || longitude == null) {
    return null;
  }

  const rmc = sentences.find((sentence) => sentence.startsWith('$GPRMC'));
  let speedKmph: number | undefined;
  if (rmc) {
    const knots = parseOptionalFloat(rmc.split(',')[7]);
    speedKmph =
      knots == null ? undefined : Math.round(knots * 1.852 * 100) / 100;
  }

  return { latitude, longitude, satellites, hdop, altitudeM, speedKmph };
}

function nmeaToDecimal(raw: string, hemisphere: string): number | null {
  if (!raw || !hemisphere) {
    return null;
  }

  const dotIndex = raw.indexOf('.');
  const degLen = dotIndex > 2 ? dotIndex - 2 : 2;
  const degrees = Number.parseFloat(raw.slice(0, degLen));
  const minutes = Number.parseFloat(raw.slice(degLen));

  if (!Number.isFinite(degrees) || !Number.isFinite(minutes)) {
    return null;
  }

  let decimal = degrees + minutes / 60;
  if (hemisphere === 'S' || hemisphere === 'W') {
    decimal *= -1;
  }

  return decimal;
}

export function extractDeviceIdFromTopic(topic: string): string | undefined {
  const parts = topic.split('/').filter(Boolean);
  if (parts.length === 0) {
    return undefined;
  }

  const last = parts.at(-1);
  if (last === 'telemetry' || last === 'status') {
    return parts.at(-2);
  }

  return last;
}
