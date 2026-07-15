/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/feature/user/entities/user.entity';
import { Device } from 'src/feature/device/entities/device.entity';
import { LocationPing } from 'src/feature/device/entities/location-ping.entity';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { GuardianLink } from 'src/feature/guardian/entities/guardian-link.entity';
import { GuardianService } from 'src/feature/guardian/guardian.service';
import { AdminService } from './admin.service';
import { Role } from 'src/feature/auth/dto/auth.dto';

describe('AdminService', () => {
  let service: AdminService;
  let userRepo: jest.Mocked<Repository<User>>;
  let deviceRepo: jest.Mocked<Repository<Device>>;
  let pingRepo: jest.Mocked<Repository<LocationPing>>;
  let sosRepo: jest.Mocked<Repository<SosEvent>>;
  let linkRepo: jest.Mocked<Repository<GuardianLink>>;
  let guardianService: { syncEmergencyContactToUserDevices: jest.Mock };

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Device),
          useValue: {
            count: jest.fn(),
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LocationPing),
          useValue: { count: jest.fn() },
        },
        {
          provide: getRepositoryToken(SosEvent),
          useValue: {
            count: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GuardianLink),
          useValue: { find: jest.fn() },
        },
        {
          provide: GuardianService,
          useValue: {
            syncEmergencyContactToUserDevices: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userRepo = module.get(getRepositoryToken(User));
    deviceRepo = module.get(getRepositoryToken(Device));
    pingRepo = module.get(getRepositoryToken(LocationPing));
    sosRepo = module.get(getRepositoryToken(SosEvent));
    linkRepo = module.get(getRepositoryToken(GuardianLink));
    guardianService = module.get(GuardianService);
  });

  describe('getStats', () => {
    it('should return dashboard stats', async () => {
      userRepo.count.mockResolvedValue(100);
      deviceRepo.count.mockResolvedValue(10);
      pingRepo.count.mockResolvedValue(5000);
      sosRepo.count.mockResolvedValue(3);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { role: 'USER', count: '50' },
          { role: 'ADMIN', count: '2' },
        ]),
      };
      userRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getStats();

      expect(result.totalUsers).toBe(100);
      expect(result.totalDevices).toBe(10);
      expect(result.totalPings).toBe(5000);
      expect(result.activeSosEvents).toBe(3);
      expect(result.usersByRole).toEqual([
        { role: 'USER', count: 50 },
        { role: 'ADMIN', count: 2 },
      ]);
    });
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([
            [mockUser(), mockUser({ id: 'user-2', email: 'user2@test.com' })],
            2,
          ]),
      };
      userRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getUsers({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0]).not.toHaveProperty('password_hash');
    });
  });

  describe('getUserDetails', () => {
    it('should throw if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.getUserDetails('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return user with guardian links', async () => {
      const user = mockUser();
      userRepo.findOne.mockResolvedValue(user);
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

      const result = await service.getUserDetails('user-1');

      expect(result.id).toBe('user-1');
      expect(result).not.toHaveProperty('password_hash');
      expect(result.guardianLinks).toHaveLength(1);
    });
  });

  describe('updateUserStatus', () => {
    it('should update user active status', async () => {
      const user = mockUser();
      userRepo.findOneBy.mockResolvedValue(user);
      userRepo.save.mockResolvedValue({ ...user, is_active: false });

      const result = await service.updateUserStatus('user-1', {
        is_active: false,
      });

      expect(result.is_active).toBe(false);
      expect(result).not.toHaveProperty('password_hash');
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      const user = mockUser();
      userRepo.findOneBy.mockResolvedValue(user);
      userRepo.save.mockResolvedValue({ ...user, role: Role.ADMIN });

      const result = await service.updateUserRole('user-1', {
        role: Role.ADMIN,
      });

      expect(result.role).toBe(Role.ADMIN);
    });
  });

  describe('getDevices', () => {
    it('should return paginated devices with owner info', async () => {
      const user = mockUser();
      const devices = [
        {
          id: 'dev-1',
          imei: 'wearable-001',
          label: 'Band',
          isOnline: true,
          lastSeenAt: null,
          user,
        },
      ];
      deviceRepo.findAndCount.mockResolvedValue([devices, 1]);

      const result = await service.getDevices(1, 20);

      expect(deviceRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ relations: ['user'] }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: 'dev-1',
        imei: 'wearable-001',
        label: 'Band',
        isOnline: true,
        lastSeenAt: null,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });
      expect(result.total).toBe(1);
    });
  });

  describe('createDevice', () => {
    it('should create a new device', async () => {
      deviceRepo.findOne.mockResolvedValue(null);
      const created = {
        id: 'dev-1',
        imei: 'wearable-001',
        label: 'wearable-001',
        isOnline: false,
        lastSeenAt: null,
        user: null,
      };
      deviceRepo.create.mockReturnValue(created);
      deviceRepo.save.mockResolvedValue(created);

      const result = await service.createDevice({ imei: 'wearable-001' });

      expect(result.imei).toBe('wearable-001');
      expect(result.user).toBeNull();
    });

    it('should reject duplicate imei', async () => {
      deviceRepo.findOne.mockResolvedValue({
        id: 'dev-1',
        imei: 'wearable-001',
      } as Device);

      await expect(
        service.createDevice({ imei: 'wearable-001' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('assignDevice', () => {
    const device = {
      id: 'dev-1',
      imei: 'wearable-001',
      label: 'Band',
      isOnline: true,
      lastSeenAt: null,
      user: null,
    } as Device;

    it('should assign device to USER', async () => {
      const user = mockUser();
      deviceRepo.findOne.mockResolvedValue({ ...device });
      userRepo.findOneBy.mockResolvedValue(user);
      deviceRepo.save.mockImplementation(async (d) => ({
        ...d,
        user,
      }));

      const result = await service.assignDevice('dev-1', 'user-1');

      expect(result.user?.id).toBe('user-1');
      expect(guardianService.syncEmergencyContactToUserDevices).toHaveBeenCalledWith(
        'user-1',
      );
    });

    it('should reject non-USER role', async () => {
      deviceRepo.findOne.mockResolvedValue(device);
      userRepo.findOneBy.mockResolvedValue(mockUser({ role: Role.GUARDIAN }));

      await expect(service.assignDevice('dev-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject if already assigned to another user', async () => {
      const other = mockUser({ id: 'user-2', full_name: 'Other' });
      deviceRepo.findOne.mockResolvedValue({ ...device, user: other });
      userRepo.findOneBy.mockResolvedValue(mockUser());

      await expect(service.assignDevice('dev-1', 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('unassignDevice', () => {
    it('should clear device owner', async () => {
      const user = mockUser();
      const device = {
        id: 'dev-1',
        imei: 'wearable-001',
        label: 'Band',
        isOnline: true,
        lastSeenAt: null,
        user,
      } as Device;
      deviceRepo.findOne.mockResolvedValue(device);
      deviceRepo.save.mockImplementation(async (d) => ({
        ...d,
        user: null,
      }));

      const result = await service.unassignDevice('dev-1');

      expect(result.user).toBeNull();
    });

    it('should throw if device not found', async () => {
      deviceRepo.findOne.mockResolvedValue(null);

      await expect(service.unassignDevice('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSosEvents', () => {
    it('should return filtered SOS events', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([
            [{ id: 'sos-1', status: 'active', device: { id: 'dev-1' } }],
            1,
          ]),
      };
      sosRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getSosEvents({
        status: 'active',
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('getSosEventDetails', () => {
    it('should throw if not found', async () => {
      sosRepo.findOne.mockResolvedValue(null);
      await expect(service.getSosEventDetails('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('resolveSosEvent', () => {
    it('should resolve SOS event', async () => {
      const event = {
        id: 'sos-1',
        device: {
          id: 'dev-1',
          imei: '123456',
          label: 'Device',
          isOnline: true,
          lastSeenAt: null,
          user: null,
        },
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
      };
      sosRepo.findOneBy
        .mockResolvedValueOnce(event as any)
        .mockResolvedValueOnce({
          ...event,
          status: 'resolved',
          resolvedAt: new Date(),
        });
      sosRepo.update.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });

      const result = await service.resolveSosEvent('sos-1');

      expect(sosRepo.update).toHaveBeenCalledWith(
        { id: 'sos-1', status: 'active' },
        expect.objectContaining({ status: 'resolved' }),
      );
      expect(result?.status).toBe('resolved');
    });
  });
});
