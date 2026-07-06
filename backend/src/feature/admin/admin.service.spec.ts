/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/feature/user/entities/user.entity';
import { Device } from 'src/feature/device/entities/device.entity';
import { LocationPing } from 'src/feature/device/entities/location-ping.entity';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { GuardianLink } from 'src/feature/guardian/entities/guardian-link.entity';
import { AdminService } from './admin.service';
import { Role } from 'src/feature/auth/dto/auth.dto';

describe('AdminService', () => {
  let service: AdminService;
  let userRepo: jest.Mocked<Repository<User>>;
  let deviceRepo: jest.Mocked<Repository<Device>>;
  let pingRepo: jest.Mocked<Repository<LocationPing>>;
  let sosRepo: jest.Mocked<Repository<SosEvent>>;
  let linkRepo: jest.Mocked<Repository<GuardianLink>>;

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
          useValue: { count: jest.fn(), findAndCount: jest.fn() },
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
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GuardianLink),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userRepo = module.get(getRepositoryToken(User));
    deviceRepo = module.get(getRepositoryToken(Device));
    pingRepo = module.get(getRepositoryToken(LocationPing));
    sosRepo = module.get(getRepositoryToken(SosEvent));
    linkRepo = module.get(getRepositoryToken(GuardianLink));
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
    it('should return paginated devices', async () => {
      const devices = [
        {
          id: 'dev-1',
          imei: '123456',
          label: 'Device',
          isOnline: true,
          lastSeenAt: null,
          user: null,
        },
      ];
      deviceRepo.findAndCount.mockResolvedValue([devices, 1]);

      const result = await service.getDevices(1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
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
      sosRepo.findOneBy.mockResolvedValue(event as any);
      sosRepo.save.mockResolvedValue({
        ...event,
        status: 'resolved',
        resolvedAt: new Date(),
      });

      const result = await service.resolveSosEvent('sos-1');

      expect(result.status).toBe('resolved');
    });
  });
});
