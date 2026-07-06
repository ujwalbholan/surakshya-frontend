/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../device/entities/device.entity';
import { LocationPing } from '../device/entities/location-ping.entity';
import { SosEvent } from '../device/entities/sos-event.entity';
import { TrackingService } from './tracking.service';
import { TrackingGateway } from './tracking.gateway';

describe('TrackingService', () => {
  let service: TrackingService;
  let deviceRepo: jest.Mocked<Repository<Device>>;
  let pingRepo: jest.Mocked<Repository<LocationPing>>;
  let gateway: jest.Mocked<TrackingGateway>;

  const mockDevice: Device = {
    id: 'dev-1',
    imei: 'IMEI123',
    label: 'IMEI123',
    isOnline: true,
    lastSeenAt: new Date(),
    user: undefined,
  };
  const now = new Date();

  const makePing = (overrides: Partial<LocationPing> = {}): LocationPing => ({
    id: 'ping-1',
    device: mockDevice,
    sosEvent: null,
    latitude: 27.7,
    longitude: 85.33,
    altitudeM: undefined,
    speedKmph: undefined,
    satellites: undefined,
    hdop: undefined,
    recordedAt: now,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingService,
        {
          provide: getRepositoryToken(Device),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LocationPing),
          useValue: { create: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(SosEvent),
          useValue: { findOne: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
        {
          provide: TrackingGateway,
          useValue: { emitLocationUpdate: jest.fn(), emitSosEvent: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<TrackingService>(TrackingService);
    deviceRepo = module.get(getRepositoryToken(Device));
    pingRepo = module.get(getRepositoryToken(LocationPing));
    gateway = module.get(TrackingGateway);
  });

  describe('ingestTelemetry', () => {
    it('should skip if coordinates are missing', async () => {
      const result = await service.ingestTelemetry({
        deviceId: 'IMEI123',
        latitude: undefined,
        longitude: undefined,
      } as any);

      expect(result).toBeUndefined();
      expect(deviceRepo.findOne).not.toHaveBeenCalled();
    });

    it('should auto-register unknown device and save ping', async () => {
      deviceRepo.findOne.mockResolvedValue(null);
      deviceRepo.create.mockReturnValue(mockDevice);
      deviceRepo.save.mockResolvedValue(mockDevice);

      const ping = makePing();
      pingRepo.create.mockReturnValue(ping);
      pingRepo.save.mockResolvedValue(ping);

      const result = await service.ingestTelemetry({
        deviceId: 'IMEI123',
        latitude: 27.7,
        longitude: 85.33,
        nmeaSentences: [],
      });

      expect(deviceRepo.findOne).toHaveBeenCalledWith({
        where: { imei: 'IMEI123' },
      });
      expect(deviceRepo.create).toHaveBeenCalled();
      expect(pingRepo.save).toHaveBeenCalled();
      expect(gateway.emitLocationUpdate).toHaveBeenCalled();
      expect(result?.deviceId).toBe('IMEI123');
    });

    it('should use existing device and save ping with altitude', async () => {
      deviceRepo.findOne.mockResolvedValue(mockDevice);

      const ping = makePing({ altitudeM: 1400, speedKmph: 30 });
      pingRepo.create.mockReturnValue(ping);
      pingRepo.save.mockResolvedValue(ping);

      const result = await service.ingestTelemetry({
        deviceId: 'IMEI123',
        latitude: 27.7,
        longitude: 85.33,
        altitudeM: 1400,
        speedKmph: 30,
        nmeaSentences: [],
      });

      expect(result?.latitude).toBe(27.7);
      expect(result?.altitudeM).toBe(1400);
      expect(deviceRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('ingestMqttMessage', () => {
    it('should parse JSON payload', async () => {
      deviceRepo.findOne.mockResolvedValue(mockDevice);
      const ping = makePing();
      pingRepo.create.mockReturnValue(ping);
      pingRepo.save.mockResolvedValue(ping);

      await service.ingestMqttMessage(
        'device/IMEI123/telemetry',
        JSON.stringify({ latitude: 27.7, longitude: 85.33 }),
      );

      expect(pingRepo.save).toHaveBeenCalled();
    });

    it('should handle plain text telemetry format', async () => {
      deviceRepo.findOne.mockResolvedValue(mockDevice);
      const ping = makePing();
      pingRepo.create.mockReturnValue(ping);
      pingRepo.save.mockResolvedValue(ping);

      await service.ingestMqttMessage(
        'device/IMEI123/telemetry',
        'Device: IMEI123\nLatitude: 27.7\nLongitude: 85.33',
      );

      expect(pingRepo.save).toHaveBeenCalled();
    });

    it('should silently skip unparseable payloads', async () => {
      await expect(
        service.ingestMqttMessage('device/bad/telemetry', 'not-parseable'),
      ).resolves.toBeUndefined();
    });
  });
});
