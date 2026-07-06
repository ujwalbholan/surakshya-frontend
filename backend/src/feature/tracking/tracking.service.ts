import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../device/entities/device.entity';
import { LocationPing } from '../device/entities/location-ping.entity';
import { SosEvent } from '../device/entities/sos-event.entity';
import {
  DeviceTelemetry,
  extractDeviceIdFromTopic,
  parseDeviceTelemetry,
} from './device-telemetry.parser';
import { TrackingGateway } from './tracking.gateway';
import { TrackingIngestService } from './tracking-ingest.interface';
import { LocationUpdatePayload } from './tracking.types';

const SOS_EVENT_TYPES = ['sos_started', 'sos_stopped'];

@Injectable()
export class TrackingService implements TrackingIngestService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    @InjectRepository(LocationPing)
    private readonly pingRepo: Repository<LocationPing>,
    @InjectRepository(SosEvent)
    private readonly sosRepo: Repository<SosEvent>,
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
    if (eventType && SOS_EVENT_TYPES.includes(eventType)) {
      await this.ingestSosEvent(topic, json);
      return;
    }

    const deviceId = String(
      (json.deviceId as string) ??
        (json.device as string) ??
        extractDeviceIdFromTopic(topic) ??
        '',
    );

    if (!deviceId) {
      this.logger.warn(`JSON payload missing deviceId on topic ${topic}`);
      return;
    }

    await this.ingestTelemetry({
      deviceId,
      latitude: parseOptionalNumber(json.latitude),
      longitude: parseOptionalNumber(json.longitude),
      altitudeM: parseOptionalNumber(json.altitude ?? json.altitudeM),
      speedKmph: parseOptionalNumber(json.speedKmph ?? json.speed),
      satellites: parseOptionalNumber(json.satellites),
      hdop: parseOptionalNumber(json.hdop),
      nmeaSentences: [],
    });
  }

  async ingestSosEvent(topic: string, json: Record<string, unknown>) {
    const deviceId = String(
      (json.deviceId as string) ?? extractDeviceIdFromTopic(topic) ?? '',
    );
    if (!deviceId) {
      this.logger.warn(`SOS event missing deviceId on topic ${topic}`);
      return;
    }

    const eventType = json.eventType as string;
    const device = await this.findOrCreateDevice(deviceId);

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

      const sos = this.sosRepo.create({
        device,
        status: 'active',
        eventType: 'sos_started',
        latitude: parseOptionalNumber(json.latitude) ?? null,
        longitude: parseOptionalNumber(json.longitude) ?? null,
        altitudeM: parseOptionalNumber(json.altitudeM) ?? null,
        speedKmph: parseOptionalNumber(json.speedKmph) ?? null,
        satellites: parseOptionalNumber(json.satellites) ?? null,
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
        startedAt: saved.startedAt.toISOString(),
        latestPing: ping
          ? {
              latitude: ping.latitude,
              longitude: ping.longitude,
              recordedAt: ping.recordedAt.toISOString(),
            }
          : null,
      });
      this.logger.log(`SOS started for device ${deviceId} (${saved.id})`);
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

      activeSos.status = 'resolved';
      activeSos.resolvedAt = new Date();
      activeSos.eventType = 'sos_stopped';
      await this.sosRepo.save(activeSos);

      this.trackingGateway.emitSosEvent({
        id: activeSos.id,
        deviceId,
        deviceImei: device.imei,
        eventType: 'sos_stopped',
        status: 'resolved',
        startedAt: activeSos.startedAt.toISOString(),
        resolvedAt: activeSos.resolvedAt.toISOString(),
        latestPing: null,
      });
      this.logger.log(`SOS resolved for device ${deviceId} (${activeSos.id})`);
    }
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

  private async createLocationPing(
    device: Device,
    json: Record<string, unknown>,
    sosEvent?: SosEvent,
  ): Promise<LocationPing | null> {
    const lat = parseOptionalNumber(json.latitude);
    const lng = parseOptionalNumber(json.longitude);
    if (lat == null || lng == null) return null;

    const ping = this.pingRepo.create({
      device,
      latitude: lat,
      longitude: lng,
      altitudeM: parseOptionalNumber(json.altitudeM),
      speedKmph: parseOptionalNumber(json.speedKmph),
      satellites: parseOptionalNumber(json.satellites),
      sosEvent: sosEvent ?? undefined,
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
