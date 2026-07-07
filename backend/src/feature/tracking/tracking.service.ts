import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Device } from '../device/entities/device.entity';
import { LocationPing } from '../device/entities/location-ping.entity';
import { SosEvent } from '../device/entities/sos-event.entity';
import { PoliceStation } from '../police-stations/entities/police-station.entity';
import {
  DeviceTelemetry,
  extractDeviceIdFromTopic,
  parseDeviceTelemetry,
} from './device-telemetry.parser';
import { TrackingGateway } from './tracking.gateway';
import { TrackingIngestService } from './tracking-ingest.interface';
import { LocationUpdatePayload } from './tracking.types';

const SOS_LIFECYCLE_TYPES = ['sos_started', 'sos_stopped'];
const SOS_LOCATION_EMIT_THROTTLE_MS = 2500;

@Injectable()
export class TrackingService implements TrackingIngestService {
  private readonly logger = new Logger(TrackingService.name);
  private readonly sosLocationLastEmit = new Map<string, number>();

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    @InjectRepository(LocationPing)
    private readonly pingRepo: Repository<LocationPing>,
    @InjectRepository(SosEvent)
    private readonly sosRepo: Repository<SosEvent>,
    @InjectRepository(PoliceStation)
    private readonly stationRepo: Repository<PoliceStation>,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  async ingestMqttMessage(topic: string, payload: string): Promise<void> {
    try {
      const json = JSON.parse(payload) as Record<string, unknown>;
      await this.ingestJson(topic, json);
      return;
    } catch {
      // plain-text telemetry from the wearable
    }

    const fallbackDeviceId = extractDeviceIdFromTopic(topic);
    const telemetry = parseDeviceTelemetry(payload, fallbackDeviceId);

    if (!telemetry) {
      this.logger.warn(`Could not parse MQTT payload on topic ${topic}`);
      return;
    }

    await this.ingestTelemetry(telemetry);
  }

  async ingestJson(topic: string, json: Record<string, unknown>) {
    const eventType = json.eventType as string | undefined;

    if (eventType && SOS_LIFECYCLE_TYPES.includes(eventType)) {
      await this.ingestSosEvent(topic, json);
      return;
    }

    if (eventType === 'sos_location') {
      await this.ingestSosLocation(topic, json);
      return;
    }

    if (eventType === 'emergency_call') {
      await this.ingestEmergencyCall(topic, json);
      return;
    }

    const deviceId = this.resolveDeviceId(topic, json);

    if (!deviceId) {
      this.logger.warn(`JSON payload missing deviceId on topic ${topic}`);
      return;
    }

    await this.ingestTelemetry(normalizeIotTelemetry(deviceId, json));
  }

  async ingestSosEvent(topic: string, json: Record<string, unknown>) {
    const deviceId = this.resolveDeviceId(topic, json);
    if (!deviceId) {
      this.logger.warn(`SOS event missing deviceId on topic ${topic}`);
      return;
    }

    const eventType = json.eventType as string;
    const device = await this.findOrCreateDevice(deviceId);
    const connectionType = json.connectionType as string | undefined;

    if (eventType === 'sos_started') {
      await this.deviceRepo.update(device.id, {
        lastSeenAt: new Date(),
        isOnline: true,
      });

      const existing = await this.sosRepo.findOne({
        where: { device: { id: device.id }, status: 'active' },
      });
      if (existing) {
        this.logger.warn(
          `Device ${deviceId} already has an active SOS event ${existing.id}`,
        );
      }

      const latitude = parseOptionalNumber(json.latitude) ?? null;
      const longitude = parseOptionalNumber(json.longitude) ?? null;
      const triggerNotes = parseTriggerNotes(json);
      const assignedStation = await this.assignNearestStation(
        latitude,
        longitude,
      );

      const sos = this.sosRepo.create({
        device,
        status: 'active',
        eventType: 'sos_started',
        latitude,
        longitude,
        altitudeM: parseAltitudeM(json) ?? null,
        speedKmph: parseOptionalNumber(json.speedKmph) ?? null,
        satellites: parseOptionalNumber(json.satellites) ?? null,
        triggerNotes,
        assignedStation: assignedStation ?? undefined,
      });
      const saved = await this.sosRepo.save(sos);

      const ping = await this.createLocationPing(device, json, saved);
      this.trackingGateway.emitSosEvent({
        id: saved.id,
        deviceId,
        deviceImei: device.imei,
        eventType: 'sos_started',
        status: 'active',
        latitude: saved.latitude ?? undefined,
        longitude: saved.longitude ?? undefined,
        altitudeM: saved.altitudeM ?? undefined,
        speedKmph: saved.speedKmph ?? undefined,
        satellites: saved.satellites ?? undefined,
        triggerNotes: saved.triggerNotes ?? undefined,
        assignedStationId: assignedStation?.id,
        assignedStationName: assignedStation?.name,
        startedAt: saved.startedAt.toISOString(),
        latestPing: ping
          ? {
              latitude: ping.latitude,
              longitude: ping.longitude,
              recordedAt: ping.recordedAt.toISOString(),
            }
          : null,
      });
      this.logger.log(
        `SOS started for device ${deviceId} (${saved.id})` +
          (connectionType ? ` via ${connectionType}` : ''),
      );
    } else if (eventType === 'sos_stopped') {
      const activeSos = await this.sosRepo.findOne({
        where: { device: { id: device.id }, status: 'active' },
        relations: ['device'],
      });

      if (!activeSos) {
        this.logger.warn(
          `sos_stopped received but no active SOS for device ${deviceId}`,
        );
        return;
      }

      const resolvedAt = new Date();
      const result = await this.sosRepo.update(
        { id: activeSos.id, status: 'active' },
        {
          status: 'resolved',
          resolvedAt,
          eventType: 'sos_stopped',
        },
      );

      if (!result.affected) {
        this.logger.debug(
          `sos_stopped: event ${activeSos.id} already resolved (race with manual resolve)`,
        );
        return;
      }

      this.sosLocationLastEmit.delete(activeSos.id);

      this.trackingGateway.emitSosEvent({
        id: activeSos.id,
        deviceId,
        deviceImei: device.imei,
        eventType: 'sos_stopped',
        status: 'resolved',
        startedAt: activeSos.startedAt.toISOString(),
        resolvedAt: resolvedAt.toISOString(),
        latestPing: null,
      });
      this.logger.log(`SOS resolved for device ${deviceId} (${activeSos.id})`);
    }
  }

  async ingestSosLocation(topic: string, json: Record<string, unknown>) {
    const deviceId = this.resolveDeviceId(topic, json);
    if (!deviceId) {
      this.logger.warn(`sos_location missing deviceId on topic ${topic}`);
      return;
    }

    const latitude = parseOptionalNumber(json.latitude);
    const longitude = parseOptionalNumber(json.longitude);
    if (latitude == null || longitude == null) {
      this.logger.warn(`sos_location missing coordinates for device ${deviceId}`);
      return;
    }

    const payload = await this.ingestTelemetry(
      normalizeIotTelemetry(deviceId, json),
    );
    if (!payload) {
      return;
    }

    const device = await this.deviceRepo.findOne({ where: { imei: deviceId } });
    if (!device) {
      return;
    }

    const activeSos = await this.sosRepo.findOne({
      where: { device: { id: device.id }, status: 'active' },
    });
    if (!activeSos) {
      return;
    }

    if (!this.shouldEmitSosLocation(activeSos.id)) {
      return;
    }

    this.trackingGateway.emitSosEvent({
      id: activeSos.id,
      deviceId,
      deviceImei: device.imei,
      eventType: 'sos_location',
      status: 'active',
      latitude: activeSos.latitude ?? undefined,
      longitude: activeSos.longitude ?? undefined,
      altitudeM: activeSos.altitudeM ?? undefined,
      speedKmph: activeSos.speedKmph ?? undefined,
      satellites: activeSos.satellites ?? undefined,
      startedAt: activeSos.startedAt.toISOString(),
      latestPing: {
        latitude: payload.latitude,
        longitude: payload.longitude,
        recordedAt: payload.recordedAt,
      },
    });
  }

  async ingestEmergencyCall(topic: string, json: Record<string, unknown>) {
    const deviceId = this.resolveDeviceId(topic, json);
    if (!deviceId) {
      this.logger.warn(`emergency_call missing deviceId on topic ${topic}`);
      return;
    }

    const device = await this.findOrCreateDevice(deviceId);
    await this.deviceRepo.update(device.id, {
      lastSeenAt: new Date(),
      isOnline: true,
    });

    const phoneNumber = json.phoneNumber as string | undefined;
    const connectionType = json.connectionType as string | undefined;
    this.logger.log(
      `Emergency call from device ${deviceId}` +
        (phoneNumber ? ` to ${phoneNumber}` : '') +
        (connectionType ? ` via ${connectionType}` : ''),
    );

    const latitude = parseOptionalNumber(json.latitude);
    const longitude = parseOptionalNumber(json.longitude);
    let latestPing: LocationUpdatePayload | undefined;

    if (latitude != null && longitude != null) {
      latestPing = await this.ingestTelemetry(
        normalizeIotTelemetry(deviceId, json),
      );
    }

    this.trackingGateway.emitSosEvent({
      id: `emergency-call-${deviceId}-${Date.now()}`,
      deviceId,
      deviceImei: device.imei,
      eventType: 'emergency_call',
      status: 'active',
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      startedAt: parseRecordedAt(json)?.toISOString() ?? new Date().toISOString(),
      latestPing: latestPing
        ? {
            latitude: latestPing.latitude,
            longitude: latestPing.longitude,
            recordedAt: latestPing.recordedAt,
          }
        : null,
    });
  }

  async ingestTelemetry(data: DeviceTelemetry) {
    if (data.latitude == null || data.longitude == null) {
      this.logger.warn(`No coordinates for device ${data.deviceId}`);
      return;
    }

    const device = await this.findOrCreateDevice(data.deviceId);

    await this.deviceRepo.update(device.id, {
      lastSeenAt: new Date(),
      isOnline: true,
    });

    const activeSos = await this.sosRepo.findOne({
      where: { device: { id: device.id }, status: 'active' },
    });

    const ping = this.pingRepo.create({
      device,
      latitude: data.latitude,
      longitude: data.longitude,
      altitudeM: data.altitudeM,
      speedKmph: data.speedKmph,
      satellites: data.satellites,
      hdop: data.hdop,
      sosEvent: activeSos ?? undefined,
      ...(data.recordedAt ? { recordedAt: data.recordedAt } : {}),
    });

    const saved = await this.pingRepo.save(ping);
    const payload = this.toPayload(saved, data.deviceId);

    this.trackingGateway.emitLocationUpdate(payload);
    this.logger.log(
      `Saved and broadcast ping for ${data.deviceId}: ${data.latitude}, ${data.longitude}`,
    );

    return payload;
  }

  async getActiveSosForDevice(deviceId: string): Promise<SosEvent | null> {
    const device = await this.deviceRepo.findOne({ where: { imei: deviceId } });
    if (!device) return null;

    return (
      this.sosRepo.findOne({
        where: { device: { id: device.id }, status: 'active' },
      }) ?? null
    );
  }

  private shouldEmitSosLocation(sosEventId: string): boolean {
    const now = Date.now();
    const lastEmit = this.sosLocationLastEmit.get(sosEventId) ?? 0;
    if (now - lastEmit < SOS_LOCATION_EMIT_THROTTLE_MS) {
      return false;
    }
    this.sosLocationLastEmit.set(sosEventId, now);
    return true;
  }

  private async assignNearestStation(
    latitude: number | null,
    longitude: number | null,
  ): Promise<PoliceStation | null> {
    if (latitude == null || longitude == null) {
      return null;
    }

    try {
      const stations = await this.stationRepo.find({
        where: {
          latitude: Not(IsNull()),
          longitude: Not(IsNull()),
        },
      });

      if (!stations.length) {
        return null;
      }

      let nearest: PoliceStation | null = null;
      let minDistanceKm = Infinity;

      for (const station of stations) {
        if (station.latitude == null || station.longitude == null) {
          continue;
        }

        const distanceKm = haversineDistanceKm(
          latitude,
          longitude,
          station.latitude,
          station.longitude,
        );

        if (distanceKm < minDistanceKm) {
          minDistanceKm = distanceKm;
          nearest = station;
        }
      }

      return nearest;
    } catch (error) {
      this.logger.warn(
        `Station assignment failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  private resolveDeviceId(
    topic: string,
    json: Record<string, unknown>,
  ): string {
    return String(
      (json.deviceId as string) ??
        (json.device as string) ??
        extractDeviceIdFromTopic(topic) ??
        '',
    );
  }

  private async createLocationPing(
    device: Device,
    json: Record<string, unknown>,
    sosEvent?: SosEvent,
  ): Promise<LocationPing | null> {
    const lat = parseOptionalNumber(json.latitude);
    const lng = parseOptionalNumber(json.longitude);
    if (lat == null || lng == null) return null;

    const recordedAt = parseRecordedAt(json);
    const ping = this.pingRepo.create({
      device,
      latitude: lat,
      longitude: lng,
      altitudeM: parseAltitudeM(json),
      speedKmph: parseOptionalNumber(json.speedKmph),
      satellites: parseOptionalNumber(json.satellites),
      sosEvent: sosEvent ?? undefined,
      ...(recordedAt ? { recordedAt } : {}),
    });
    return this.pingRepo.save(ping);
  }

  private toPayload(
    ping: LocationPing,
    deviceId: string,
  ): LocationUpdatePayload {
    return {
      id: ping.id,
      deviceId,
      latitude: ping.latitude,
      longitude: ping.longitude,
      altitudeM: ping.altitudeM,
      speedKmph: ping.speedKmph,
      satellites: ping.satellites,
      hdop: ping.hdop,
      recordedAt: ping.recordedAt.toISOString(),
    };
  }

  private async findOrCreateDevice(deviceId: string): Promise<Device> {
    let device = await this.deviceRepo.findOne({ where: { imei: deviceId } });

    if (!device) {
      device = this.deviceRepo.create({ imei: deviceId, label: deviceId });
      device = await this.deviceRepo.save(device);
      this.logger.log(`Registered new device: ${deviceId}`);
    }

    return device;
  }
}

function normalizeIotTelemetry(
  deviceId: string,
  json: Record<string, unknown>,
): DeviceTelemetry {
  return {
    deviceId,
    latitude: parseOptionalNumber(json.latitude),
    longitude: parseOptionalNumber(json.longitude),
    altitudeM: parseAltitudeM(json),
    speedKmph: parseOptionalNumber(json.speedKmph ?? json.speed),
    satellites: parseOptionalNumber(json.satellites),
    hdop: parseOptionalNumber(json.hdop),
    recordedAt: parseRecordedAt(json),
    nmeaSentences: [],
  };
}

function parseTriggerNotes(json: Record<string, unknown>): string | null {
  const raw = json.message ?? json.note;
  if (raw == null) {
    return null;
  }

  const trimmed = String(raw).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseAltitudeM(json: Record<string, unknown>): number | undefined {
  return parseOptionalNumber(json.altitude ?? json.altitudeM);
}

function parseRecordedAt(json: Record<string, unknown>): Date | undefined {
  const raw = json.timestamp ?? json.recordedAt;
  if (raw == null || raw === '') {
    return undefined;
  }

  const parsed = new Date(String(raw));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseOptionalNumber(value: unknown): number | undefined {
  if (value == null || value === '') {
    return undefined;
  }

  let parsed: number | undefined;

  if (typeof value === 'number') {
    parsed = value;
  } else if (typeof value === 'string') {
    parsed = Number.parseFloat(value);
  } else {
    parsed = undefined;
  }

  return Number.isFinite(parsed) ? parsed : undefined;
}
