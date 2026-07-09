import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from 'src/feature/device/entities/device.entity';
import { LocationPing } from 'src/feature/device/entities/location-ping.entity';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { NotificationFailure } from 'src/feature/notification/entities/notification-failure.entity';
import { PoliceStation } from 'src/feature/police-stations/entities/police-station.entity';
import { User } from 'src/feature/user/entities/user.entity';
import { EmergencyService } from './emergency.service';

describe('EmergencyService', () => {
  let service: EmergencyService;
  let sosRepo: jest.Mocked<Repository<SosEvent>>;
  let pingRepo: jest.Mocked<Repository<LocationPing>>;

  const station: PoliceStation = {
    id: 'station-1',
    name: 'Thamel Police Station',
    address: 'Thamel',
    contact_number: '014412345',
    latitude: 27.7172,
    longitude: 85.324,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const user: User = {
    id: 'user-1',
    full_name: 'Priya Sharma',
    email: 'priya@test.com',
    phone: '9812345678',
    password_hash: 'hash',
    role: 'USER',
    is_active: true,
    phone_verified: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const device: Device = {
    id: 'device-1',
    imei: '860000000000001',
    label: 'Wristband 1',
    isOnline: true,
    lastSeenAt: new Date(),
    user,
  };

  const activeEvent: SosEvent = {
    id: 'sos-1',
    device,
    status: 'active',
    eventType: 'sos_started',
    latitude: 27.7172,
    longitude: 85.324,
    altitudeM: 1300,
    triggerNotes: 'Help needed',
    assignedStation: station,
    startedAt: new Date('2026-07-07T08:00:00Z'),
    resolvedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmergencyService,
        {
          provide: getRepositoryToken(SosEvent),
          useValue: { find: jest.fn(), count: jest.fn() },
        },
        {
          provide: getRepositoryToken(Device),
          useValue: { find: jest.fn(), count: jest.fn() },
        },
        {
          provide: getRepositoryToken(LocationPing),
          useValue: { findOne: jest.fn(), count: jest.fn(), find: jest.fn() },
        },
        {
          provide: getRepositoryToken(NotificationFailure),
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmergencyService>(EmergencyService);
    sosRepo = module.get(getRepositoryToken(SosEvent));
    pingRepo = module.get(getRepositoryToken(LocationPing));
  });

  describe('getLiveEmergencies', () => {
    it('returns enriched active events with station and user fields', async () => {
      sosRepo.find.mockResolvedValue([activeEvent]);
      pingRepo.findOne.mockResolvedValue({
        id: 'ping-1',
        device,
        latitude: 27.718,
        longitude: 85.325,
        recordedAt: new Date('2026-07-07T08:01:00Z'),
      });

      const result = await service.getLiveEmergencies();

      expect(result.total).toBe(1);
      expect(result.data[0]).toMatchObject({
        id: 'sos-1',
        deviceId: 'device-1',
        userId: 'user-1',
        imei: '860000000000001',
        label: 'Wristband 1',
        eventType: 'sos_started',
        status: 'active',
        triggerNotes: 'Help needed',
        assignedStationId: 'station-1',
        assignedStationName: 'Thamel Police Station',
        user: {
          id: 'user-1',
          fullName: 'Priya Sharma',
          phone: '9812345678',
        },
        lastLocation: {
          latitude: 27.718,
          longitude: 85.325,
        },
      });
    });

    it('returns empty list when no active events exist', async () => {
      sosRepo.find.mockResolvedValue([]);

      const result = await service.getLiveEmergencies();

      expect(result).toEqual({ data: [], total: 0 });
      expect(pingRepo.findOne).not.toHaveBeenCalled();
    });
  });
});
