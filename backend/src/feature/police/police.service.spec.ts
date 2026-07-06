import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/feature/user/entities/user.entity';
import { Device } from 'src/feature/device/entities/device.entity';
import { LocationPing } from 'src/feature/device/entities/location-ping.entity';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { GuardianLink } from 'src/feature/guardian/entities/guardian-link.entity';
import { PoliceService } from './police.service';
import { Role } from 'src/feature/auth/dto/auth.dto';

describe('PoliceService', () => {
  let service: PoliceService;
  let sosRepo: jest.Mocked<Repository<SosEvent>>;
  let pingRepo: jest.Mocked<Repository<LocationPing>>;
  let deviceRepo: jest.Mocked<Repository<Device>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let linkRepo: jest.Mocked<Repository<GuardianLink>>;

  const mockDevice: Device = {
    id: 'dev-1',
    imei: '1234567890',
    label: 'Test Device',
    isOnline: true,
    lastSeenAt: new Date(),
    user: null,
  };

  const mockUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-1',
    full_name: 'Test User',
    email: 'user@test.com',
    phone: '9800000000',
    password_hash: 'hashed',
    role: Role.USER,
    is_active: true,
    phone_verified: false,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  });

  const mockSosEvent = (overrides: Partial<SosEvent> = {}): SosEvent => ({
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
    startedAt: new Date(),
    resolvedAt: null,
    ...overrides,
  });

  const mockPing = (overrides: Partial<LocationPing> = {}): LocationPing => ({
    id: 'ping-1',
    device: mockDevice,
    sosEvent: null,
    latitude: 27.7,
    longitude: 85.33,
    altitudeM: undefined,
    speedKmph: undefined,
    satellites: undefined,
    hdop: undefined,
    recordedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoliceService,
        {
          provide: getRepositoryToken(SosEvent),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LocationPing),
          useValue: { find: jest.fn(), findOne: jest.fn(), count: jest.fn() },
        },
        {
          provide: getRepositoryToken(Device),
          useValue: { findOneBy: jest.fn(), count: jest.fn() },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { findOneBy: jest.fn(), count: jest.fn() },
        },
        {
          provide: getRepositoryToken(GuardianLink),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PoliceService>(PoliceService);
    sosRepo = module.get(getRepositoryToken(SosEvent));
    pingRepo = module.get(getRepositoryToken(LocationPing));
    deviceRepo = module.get(getRepositoryToken(Device));
    userRepo = module.get(getRepositoryToken(User));
    linkRepo = module.get(getRepositoryToken(GuardianLink));
  });

  describe('getDashboard', () => {
    it('should return dashboard stats', async () => {
      sosRepo.count.mockResolvedValueOnce(5); // active SOS
      deviceRepo.count.mockResolvedValueOnce(100); // total devices
      userRepo.count.mockResolvedValueOnce(500); // total users
      sosRepo.count.mockResolvedValueOnce(3); // SOS today
      pingRepo.count.mockResolvedValueOnce(1200); // pings today
      sosRepo.find.mockResolvedValueOnce([]); // resolved today

      const result = await service.getDashboard();

      expect(result.activeSosEvents).toBe(5);
      expect(result.totalDevices).toBe(100);
      expect(result.totalUsers).toBe(500);
      expect(result.sosEventsToday).toBe(3);
      expect(result.pingsToday).toBe(1200);
      expect(result.resolvedToday).toEqual([]);
    });
  });

  describe('getActiveSosEvents', () => {
    it('should return active SOS events with latest location', async () => {
      const event = mockSosEvent();
      sosRepo.find.mockResolvedValue([event]);
      pingRepo.findOne.mockResolvedValue(mockPing());

      const result = await service.getActiveSosEvents();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].lastLocation).toBeDefined();
      expect(result.data[0].lastLocation?.latitude).toBe(27.7);
    });

    it('should return null location if no ping exists', async () => {
      sosRepo.find.mockResolvedValue([mockSosEvent()]);
      pingRepo.findOne.mockResolvedValue(null);

      const result = await service.getActiveSosEvents();

      expect(result.data[0].lastLocation).toBeNull();
    });
  });

  describe('getSosEventDetails', () => {
    it('should throw if SOS event not found', async () => {
      sosRepo.findOne.mockResolvedValue(null);
      await expect(service.getSosEventDetails('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return event with location pings', async () => {
      sosRepo.findOne.mockResolvedValue(mockSosEvent());
      pingRepo.find.mockResolvedValue([mockPing()]);

      const result = await service.getSosEventDetails('sos-1');

      expect(result.locationPings).toHaveLength(1);
    });
  });

  describe('resolveSosEvent', () => {
    it('should throw if event not found', async () => {
      sosRepo.findOneBy.mockResolvedValue(null);
      await expect(service.resolveSosEvent('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should resolve the event', async () => {
      const event = mockSosEvent();
      sosRepo.findOneBy.mockResolvedValue(event);
      sosRepo.save.mockResolvedValue({ ...event, status: 'resolved' });

      const result = await service.resolveSosEvent('sos-1');

      expect(result.status).toBe('resolved');
      expect(result.resolvedAt).toBeDefined();
    });
  });

  describe('getDeviceLatestLocation', () => {
    it('should throw if device not found', async () => {
      deviceRepo.findOneBy.mockResolvedValue(null);
      await expect(service.getDeviceLatestLocation('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return device with null location if no ping', async () => {
      deviceRepo.findOneBy.mockResolvedValue(mockDevice);
      pingRepo.findOne.mockResolvedValue(null);

      const result = await service.getDeviceLatestLocation('dev-1');

      expect(result.lastLocation).toBeNull();
    });
  });

  describe('getUserInfo', () => {
    it('should throw if user not found', async () => {
      userRepo.findOneBy.mockResolvedValue(null);
      await expect(service.getUserInfo('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return user without password_hash', async () => {
      const user = mockUser();
      userRepo.findOneBy.mockResolvedValue(user);

      const result = await service.getUserInfo('user-1');

      expect(result).not.toHaveProperty('password_hash');
      expect(result.email).toBe('user@test.com');
    });
  });

  describe('getUserGuardians', () => {
    it('should return guardians for user', async () => {
      const link = {
        id: 'link-1',
        child_user_id: 'user-1',
        guardian_user_id: 'guardian-1',
        child: mockUser(),
        guardian: mockUser({
          id: 'guardian-1',
          full_name: 'Guardian',
          role: Role.GUARDIAN,
        }),
        created_at: new Date(),
      };
      linkRepo.find.mockResolvedValue([link]);

      const result = await service.getUserGuardians('user-1');

      expect(result.guardians).toHaveLength(1);
      expect(result.guardians[0].full_name).toBe('Guardian');
    });
  });
});
