/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../device/entities/device.entity';
import { LocationPing } from '../device/entities/location-ping.entity';
import { SosEvent } from '../device/entities/sos-event.entity';
import { PoliceStation } from '../police-stations/entities/police-station.entity';
import { TrackingService } from './tracking.service';
import { TrackingGateway } from './tracking.gateway';

describe('TrackingService', () => {
  let service: TrackingService;
  let deviceRepo: jest.Mocked<Repository<Device>>;
  let pingRepo: jest.Mocked<Repository<LocationPing>>;
  let sosRepo: jest.Mocked<Repository<SosEvent>>;
  let stationRepo: jest.Mocked<Repository<PoliceStation>>;
  let gateway: jest.Mocked<TrackingGateway>;

  const mockDevice: Device = {
    id: 'dev-1',
    imei: 'wearable-001',
    label: 'wearable-001',
    isOnline: true,
    lastSeenAt: new Date(),
    user: undefined,
  };
  const now = new Date();

  const makePing = (overrides: Partial<LocationPing> = {}): LocationPing => ({
    id: 'ping-1',
    device: mockDevice,
    sosEvent: null,
    latitude: 27.7172,
    longitude: 85.324,
    altitudeM: 1400,
    speedKmph: undefined,
    satellites: undefined,
    hdop: undefined,
    recordedAt: now,
    ...overrides,
  });

  const makeSos = (overrides: Partial<SosEvent> = {}): SosEvent => ({
    id: 'sos-1',
    device: mockDevice,
    status: 'active',
    eventType: 'sos_started',
    latitude: null,
    longitude: null,
    altitudeM: null,
    speedKmph: null,
    satellites: null,
    resolvedBy: null,
    notes: null,
    triggerNotes: null,
    assignedStation: null,
    startedAt: now,
    resolvedAt: null,
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
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PoliceStation),
          useValue: { find: jest.fn() },
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
    sosRepo = module.get(getRepositoryToken(SosEvent));
    stationRepo = module.get(getRepositoryToken(PoliceStation));
    gateway = module.get(TrackingGateway);
  });

  describe('ingestTelemetry', () => {
    it('should skip if coordinates are missing', async () => {
      const result = await service.ingestTelemetry({
        deviceId: 'wearable-001',
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
      sosRepo.findOne.mockResolvedValue(null);

      const ping = makePing();
      pingRepo.create.mockReturnValue(ping);
      pingRepo.save.mockResolvedValue(ping);

      const result = await service.ingestTelemetry({
        deviceId: 'wearable-001',
        latitude: 27.7172,
        longitude: 85.324,
        nmeaSentences: [],
      });

      expect(deviceRepo.findOne).toHaveBeenCalledWith({
        where: { imei: 'wearable-001' },
      });
      expect(deviceRepo.create).toHaveBeenCalled();
      expect(pingRepo.save).toHaveBeenCalled();
      expect(gateway.emitLocationUpdate).toHaveBeenCalled();
      expect(result?.deviceId).toBe('wearable-001');
    });

    it('should use existing device and save ping with altitude', async () => {
      deviceRepo.findOne.mockResolvedValue(mockDevice);
      sosRepo.findOne.mockResolvedValue(null);

      const ping = makePing({ altitudeM: 1400, speedKmph: 30 });
      pingRepo.create.mockReturnValue(ping);
      pingRepo.save.mockResolvedValue(ping);

      const result = await service.ingestTelemetry({
        deviceId: 'wearable-001',
        latitude: 27.7172,
        longitude: 85.324,
        altitudeM: 1400,
        speedKmph: 30,
        nmeaSentences: [],
      });

      expect(result?.latitude).toBe(27.7172);
      expect(result?.altitudeM).toBe(1400);
      expect(deviceRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('ingestMqttMessage', () => {
    it('should parse JSON payload', async () => {
      deviceRepo.findOne.mockResolvedValue(mockDevice);
      sosRepo.findOne.mockResolvedValue(null);
      const ping = makePing();
      pingRepo.create.mockReturnValue(ping);
      pingRepo.save.mockResolvedValue(ping);

      await service.ingestMqttMessage(
        'device/wearable-001/telemetry',
        JSON.stringify({
          deviceId: 'wearable-001',
          latitude: 27.7172,
          longitude: 85.324,
        }),
      );

      expect(pingRepo.save).toHaveBeenCalled();
    });

    it('should handle plain text telemetry format', async () => {
      deviceRepo.findOne.mockResolvedValue(mockDevice);
      sosRepo.findOne.mockResolvedValue(null);
      const ping = makePing();
      pingRepo.create.mockReturnValue(ping);
      pingRepo.save.mockResolvedValue(ping);

      await service.ingestMqttMessage(
        'device/wearable-001/telemetry',
        'Device: wearable-001\nLatitude: 27.7172\nLongitude: 85.324',
      );

      expect(pingRepo.save).toHaveBeenCalled();
    });

    it('should silently skip unparseable payloads', async () => {
      await expect(
        service.ingestMqttMessage('device/bad/telemetry', 'not-parseable'),
      ).resolves.toBeUndefined();
    });

    it('should ingest IoT sos_started event', async () => {
      deviceRepo.findOne.mockResolvedValue(null);
      deviceRepo.create.mockReturnValue(mockDevice);
      deviceRepo.save.mockResolvedValue(mockDevice);
      sosRepo.findOne.mockResolvedValue(null);
      stationRepo.find.mockResolvedValue([]);

      const sos = makeSos();
      sosRepo.create.mockReturnValue(sos);
      sosRepo.save.mockResolvedValue(sos);

      await service.ingestMqttMessage(
        'surakshyawatch/wearable-001/events',
        JSON.stringify({
          deviceId: 'wearable-001',
          eventType: 'sos_started',
          timestamp: '2026-07-06T15:00:00+05:45',
          sosActive: true,
          connectionType: 'sim',
        }),
      );

      expect(sosRepo.save).toHaveBeenCalled();
      expect(gateway.emitSosEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceId: 'wearable-001',
          eventType: 'sos_started',
          status: 'active',
        }),
      );
    });

    it('should parse trigger notes from message field on sos_started', async () => {
      deviceRepo.findOne.mockResolvedValue(mockDevice);
      sosRepo.findOne.mockResolvedValue(null);
      stationRepo.find.mockResolvedValue([]);

      const sos = makeSos({ triggerNotes: 'Need help now' });
      sosRepo.create.mockImplementation((data) => data as SosEvent);
      sosRepo.save.mockResolvedValue(sos);

      await service.ingestMqttMessage(
        'surakshyawatch/wearable-001/events',
        JSON.stringify({
          deviceId: 'wearable-001',
          eventType: 'sos_started',
          message: 'Need help now',
        }),
      );

      expect(sosRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ triggerNotes: 'Need help now' }),
      );
      expect(gateway.emitSosEvent).toHaveBeenCalledWith(
        expect.objectContaining({ triggerNotes: 'Need help now' }),
      );
    });

    it('should assign nearest station when coordinates and stations exist', async () => {
      deviceRepo.findOne.mockResolvedValue(mockDevice);
      sosRepo.findOne.mockResolvedValue(null);

      const nearStation: PoliceStation = {
        id: 'station-near',
        name: 'Kathmandu Central',
        address: 'Durbar Marg',
        contact_number: '100',
        latitude: 27.7172,
        longitude: 85.324,
        created_at: now,
        updated_at: now,
      };
      const farStation: PoliceStation = {
        id: 'station-far',
        name: 'Remote Station',
        address: 'Far away',
        contact_number: '101',
        latitude: 28.0,
        longitude: 86.0,
        created_at: now,
        updated_at: now,
      };
      stationRepo.find.mockResolvedValue([nearStation, farStation]);

      const sos = makeSos({
        triggerNotes: null,
        assignedStation: nearStation,
      });
      sosRepo.create.mockImplementation((data) => data as SosEvent);
      sosRepo.save.mockResolvedValue(sos);

      await service.ingestMqttMessage(
        'surakshyawatch/wearable-001/events',
        JSON.stringify({
          deviceId: 'wearable-001',
          eventType: 'sos_started',
          latitude: 27.7173,
          longitude: 85.3241,
        }),
      );

      expect(sosRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedStation: nearStation,
        }),
      );
      expect(gateway.emitSosEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedStationId: 'station-near',
          assignedStationName: 'Kathmandu Central',
        }),
      );
    });

    it('should leave assigned station null when no stations have coordinates', async () => {
      deviceRepo.findOne.mockResolvedValue(mockDevice);
      sosRepo.findOne.mockResolvedValue(null);
      stationRepo.find.mockResolvedValue([]);

      const sos = makeSos();
      sosRepo.create.mockImplementation((data) => data as SosEvent);
      sosRepo.save.mockResolvedValue(sos);

      await service.ingestMqttMessage(
        'surakshyawatch/wearable-001/events',
        JSON.stringify({
          deviceId: 'wearable-001',
          eventType: 'sos_started',
          latitude: 27.7172,
          longitude: 85.324,
        }),
      );

      expect(sosRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ assignedStation: undefined }),
      );
      expect(gateway.emitSosEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedStationId: undefined,
          assignedStationName: undefined,
        }),
      );
    });

    it('should ingest IoT sos_location and refresh active SOS websocket', async () => {
      const activeSos = makeSos();
      deviceRepo.findOne.mockResolvedValue(mockDevice);
      sosRepo.findOne.mockResolvedValue(activeSos);

      const ping = makePing();
      pingRepo.create.mockReturnValue(ping);
      pingRepo.save.mockResolvedValue(ping);

      await service.ingestMqttMessage(
        'surakshyawatch/wearable-001/events',
        JSON.stringify({
          deviceId: 'wearable-001',
          eventType: 'sos_location',
          timestamp: '2026-07-06T15:00:08+05:45',
          sosActive: true,
          latitude: 27.7172,
          longitude: 85.324,
          altitude: 1400,
          gpsValid: true,
          connectionType: 'sim',
        }),
      );

      expect(pingRepo.save).toHaveBeenCalled();
      expect(gateway.emitLocationUpdate).toHaveBeenCalled();
      expect(gateway.emitSosEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceId: 'wearable-001',
          eventType: 'sos_location',
          status: 'active',
          latestPing: expect.objectContaining({
            latitude: 27.7172,
            longitude: 85.324,
          }),
        }),
      );
    });

    it('should throttle rapid sos_location websocket emits', async () => {
      const activeSos = makeSos();
      deviceRepo.findOne.mockResolvedValue(mockDevice);
      sosRepo.findOne.mockResolvedValue(activeSos);

      const ping = makePing();
      pingRepo.create.mockReturnValue(ping);
      pingRepo.save.mockResolvedValue(ping);

      const payload = {
        deviceId: 'wearable-001',
        eventType: 'sos_location',
        latitude: 27.7172,
        longitude: 85.324,
      };

      await service.ingestMqttMessage(
        'surakshyawatch/wearable-001/events',
        JSON.stringify(payload),
      );
      await service.ingestMqttMessage(
        'surakshyawatch/wearable-001/events',
        JSON.stringify(payload),
      );

      expect(gateway.emitSosEvent).toHaveBeenCalledTimes(1);
      expect(pingRepo.save).toHaveBeenCalledTimes(2);
    });

    it('should ingest IoT sos_stopped event', async () => {
      const activeSos = makeSos();
      deviceRepo.findOne.mockResolvedValue(mockDevice);
      sosRepo.findOne.mockResolvedValue(activeSos);
      sosRepo.update.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });

      await service.ingestMqttMessage(
        'surakshyawatch/wearable-001/events',
        JSON.stringify({
          deviceId: 'wearable-001',
          eventType: 'sos_stopped',
          sosActive: false,
        }),
      );

      expect(sosRepo.update).toHaveBeenCalledWith(
        { id: 'sos-1', status: 'active' },
        expect.objectContaining({
          status: 'resolved',
          eventType: 'sos_stopped',
        }),
      );
      expect(gateway.emitSosEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceId: 'wearable-001',
          eventType: 'sos_stopped',
          status: 'resolved',
        }),
      );
    });

    it('should no-op sos_stopped when event already resolved', async () => {
      const activeSos = makeSos();
      deviceRepo.findOne.mockResolvedValue(mockDevice);
      sosRepo.findOne.mockResolvedValue(activeSos);
      sosRepo.update.mockResolvedValue({
        affected: 0,
        raw: [],
        generatedMaps: [],
      });

      await service.ingestMqttMessage(
        'surakshyawatch/wearable-001/events',
        JSON.stringify({
          deviceId: 'wearable-001',
          eventType: 'sos_stopped',
          sosActive: false,
        }),
      );

      expect(gateway.emitSosEvent).not.toHaveBeenCalled();
    });

    it('should ingest IoT emergency_call without coordinates', async () => {
      deviceRepo.findOne.mockResolvedValue(mockDevice);

      await service.ingestMqttMessage(
        'surakshyawatch/wearable-001/events',
        JSON.stringify({
          deviceId: 'wearable-001',
          eventType: 'emergency_call',
          phoneNumber: '+9779828755846',
          timestamp: '2026-07-06T15:00:00+05:45',
          connectionType: 'sim',
        }),
      );

      expect(deviceRepo.update).toHaveBeenCalled();
      expect(pingRepo.save).not.toHaveBeenCalled();
      expect(gateway.emitSosEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceId: 'wearable-001',
          eventType: 'emergency_call',
          status: 'active',
        }),
      );
    });

    it('should resolve device id from topic when JSON omits deviceId', async () => {
      deviceRepo.findOne.mockResolvedValue(null);
      deviceRepo.create.mockReturnValue(mockDevice);
      deviceRepo.save.mockResolvedValue(mockDevice);
      sosRepo.findOne.mockResolvedValue(null);

      const ping = makePing();
      pingRepo.create.mockReturnValue(ping);
      pingRepo.save.mockResolvedValue(ping);

      await service.ingestMqttMessage(
        'surakshyawatch/wearable-001/events',
        JSON.stringify({
          latitude: 27.7172,
          longitude: 85.324,
        }),
      );

      expect(deviceRepo.findOne).toHaveBeenCalledWith({
        where: { imei: 'wearable-001' },
      });
      expect(pingRepo.save).toHaveBeenCalled();
    });

    it('should create SOS via REST path with identical socket emit to MQTT', async () => {
      const phoneDevice: Device = {
        ...mockDevice,
        id: 'dev-phone',
        imei: 'phone-user-1',
        user: { id: 'user-1' } as Device['user'],
      };
      deviceRepo.findOne.mockResolvedValue(phoneDevice);
      sosRepo.findOne.mockResolvedValue(null);
      stationRepo.find.mockResolvedValue([]);

      const sos = makeSos({
        id: 'sos-rest-1',
        device: phoneDevice,
        latitude: 27.7,
        longitude: 85.3,
      });
      sosRepo.create.mockImplementation((data) => data as SosEvent);
      sosRepo.save.mockResolvedValue(sos);

      const result = await service.startSosForUser('user-1', {
        latitude: 27.7,
        longitude: 85.3,
        triggerNotes: 'source=app_button',
        connectionType: 'app',
      });

      expect(result).toEqual(
        expect.objectContaining({
          id: 'sos-rest-1',
          status: 'active',
          latitude: 27.7,
          longitude: 85.3,
        }),
      );
      expect(gateway.emitSosEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'sos-rest-1',
          deviceId: 'phone-user-1',
          eventType: 'sos_started',
          status: 'active',
        }),
      );
    });

    it('should append location for SOS owner via REST path', async () => {
      const phoneDevice: Device = {
        ...mockDevice,
        id: 'dev-phone',
        imei: 'phone-user-1',
        user: { id: 'user-1' } as Device['user'],
      };
      const activeSos = makeSos({ device: phoneDevice });
      sosRepo.findOne.mockResolvedValue(activeSos);
      deviceRepo.findOne.mockResolvedValue(phoneDevice);

      const ping = makePing({ latitude: 27.71, longitude: 85.31 });
      pingRepo.create.mockReturnValue(ping);
      pingRepo.save.mockResolvedValue(ping);

      const result = await service.appendSosLocationForActor(
        'sos-1',
        { latitude: 27.71, longitude: 85.31 },
        { userId: 'user-1', role: 'USER' },
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: 'sos-1',
          latitude: 27.71,
          longitude: 85.31,
        }),
      );
      expect(gateway.emitSosEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'sos_location',
          status: 'active',
        }),
      );
    });

    it('should reject location append for non-owner USER', async () => {
      const phoneDevice: Device = {
        ...mockDevice,
        user: { id: 'user-1' } as Device['user'],
      };
      sosRepo.findOne.mockResolvedValue(makeSos({ device: phoneDevice }));

      await expect(
        service.appendSosLocationForActor(
          'sos-1',
          { latitude: 27.71, longitude: 85.31 },
          { userId: 'user-other', role: 'USER' },
        ),
      ).rejects.toThrow('You do not own this SOS event');
    });
  });
});
