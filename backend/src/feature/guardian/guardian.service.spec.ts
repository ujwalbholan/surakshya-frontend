/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/feature/user/entities/user.entity';
import { GuardianLink } from './entities/guardian-link.entity';
import { GuardianRequest } from './entities/guardian-request.entity';
import { Device } from 'src/feature/device/entities/device.entity';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { LocationPing } from 'src/feature/device/entities/location-ping.entity';
import { GuardianService } from './guardian.service';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { NotificationService } from '../notification/notification.service';
import { RedisService } from 'src/config/redis/redis.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('GuardianService', () => {
  let service: GuardianService;
  let userRepo: jest.Mocked<Repository<User>>;
  let linkRepo: jest.Mocked<Repository<GuardianLink>>;
  let requestRepo: jest.Mocked<Repository<GuardianRequest>>;
  let deviceRepo: jest.Mocked<Repository<Device>>;
  let sosRepo: jest.Mocked<Repository<SosEvent>>;
  let pingRepo: jest.Mocked<Repository<LocationPing>>;

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  const mockUser = (overrides: Partial<User> = {}): User => ({
    id: userId,
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

  const mockGuardianLink = (
    overrides: Partial<GuardianLink> = {},
  ): GuardianLink => ({
    id: 'link-id',
    child_user_id: userId,
    guardian_user_id: 'guardian-id',
    child: mockUser(),
    guardian: mockUser({
      id: 'guardian-id',
      full_name: 'Guardian',
      role: Role.GUARDIAN,
    }),
    created_at: new Date(),
    ...overrides,
  });

  const mockGuardianRequest = (
    overrides: Partial<GuardianRequest> = {},
  ): GuardianRequest => ({
    id: 'request-id',
    requester_id: userId,
    requester_name: 'Test User',
    target_email: 'guardian@test.com',
    target_phone: '9800000001',
    target_name: 'New Guardian',
    direction: 'CHILD_TO_GUARDIAN',
    status: 'PENDING',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuardianService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GuardianLink),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GuardianRequest),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Device),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SosEvent),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LocationPing),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            sendSms: jest.fn(),
            sendEmail: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
            getClient: jest.fn().mockReturnValue({
              scan: jest.fn().mockResolvedValue(['0', []]),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GuardianService>(GuardianService);
    userRepo = module.get(getRepositoryToken(User));
    linkRepo = module.get(getRepositoryToken(GuardianLink));
    requestRepo = module.get(getRepositoryToken(GuardianRequest));
    deviceRepo = module.get(getRepositoryToken(Device));
    sosRepo = module.get(getRepositoryToken(SosEvent));
    pingRepo = module.get(getRepositoryToken(LocationPing));
  });

  describe('addGuardian', () => {
    const dto = {
      full_name: 'New Guardian',
      email: 'guardian@test.com',
      phone: '9800000001',
    };

    it('should throw if child user is not found or not USER role', async () => {
      userRepo.findOneBy.mockResolvedValue(null);
      await expect(service.addGuardian(userId, dto)).rejects.toThrow(
        BadRequestException,
      );

      userRepo.findOneBy.mockResolvedValue(mockUser({ role: Role.ADMIN }));
      await expect(service.addGuardian(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if email or phone already exists', async () => {
      userRepo.findOneBy.mockResolvedValue(mockUser());
      userRepo.findOne.mockResolvedValue(mockUser({ email: dto.email }));
      await expect(service.addGuardian(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create guardian user and request successfully', async () => {
      userRepo.findOneBy.mockResolvedValue(mockUser());
      userRepo.findOne.mockResolvedValue(null);
      const guardianUser = mockUser({
        id: 'guardian-id',
        full_name: dto.full_name,
        role: Role.GUARDIAN,
      });
      userRepo.create.mockReturnValue(guardianUser);
      userRepo.save.mockResolvedValue(guardianUser);
      requestRepo.create.mockReturnValue(mockGuardianRequest());
      requestRepo.save.mockResolvedValue(mockGuardianRequest());

      const result = await service.addGuardian(userId, dto);

      expect(result.message).toContain('Guardian request sent');
      expect(userRepo.save).toHaveBeenCalled();
      expect(requestRepo.save).toHaveBeenCalled();
    });
  });

  describe('getMyGuardians', () => {
    it('should return paginated guardians for a user', async () => {
      const link = mockGuardianLink();
      linkRepo.findAndCount.mockResolvedValue([[link], 1]);

      const result = await service.getMyGuardians(userId);

      expect(result.guardians).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.guardians[0].full_name).toBe('Guardian');
    });
  });

  describe('getMyWard', () => {
    it('should throw if no wards found', async () => {
      linkRepo.findAndCount.mockResolvedValue([[], 0]);
      await expect(service.getMyWard('guardian-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return paginated wards for a guardian', async () => {
      const link = mockGuardianLink();
      linkRepo.findAndCount.mockResolvedValue([[link], 1]);

      const result = await service.getMyWard('guardian-id');

      expect(result.wards).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.wards[0].full_name).toBe('Test User');
    });
  });

  describe('getWardSosEvents', () => {
    const guardianId = 'guardian-id';
    const wardId = userId;

    it('should throw if guardian is not linked to ward', async () => {
      linkRepo.findOne.mockResolvedValue(null);
      await expect(
        service.getWardSosEvents(guardianId, wardId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return empty list when ward has no devices', async () => {
      linkRepo.findOne.mockResolvedValue(mockGuardianLink());
      deviceRepo.find.mockResolvedValue([]);

      const result = await service.getWardSosEvents(guardianId, wardId);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.wardId).toBe(wardId);
    });

    it('should return active SOS events for ward devices', async () => {
      linkRepo.findOne.mockResolvedValue(mockGuardianLink());
      const device = {
        id: 'device-id',
        imei: '860000000000001',
        label: 'Ward device',
      } as Device;
      deviceRepo.find.mockResolvedValue([device]);

      const startedAt = new Date('2026-01-01T10:00:00Z');
      const sosEvent = {
        id: 'sos-id',
        device,
        status: 'active',
        eventType: 'sos_started',
        latitude: 27.7,
        longitude: 85.3,
        triggerNotes: 'Help',
        assignedStation: { id: 'station-id', name: 'Kathmandu' },
        startedAt,
        resolvedAt: null,
      } as SosEvent;
      sosRepo.find.mockResolvedValue([sosEvent]);
      pingRepo.findOne.mockResolvedValue({
        latitude: 27.71,
        longitude: 85.31,
        recordedAt: new Date('2026-01-01T10:01:00Z'),
      } as LocationPing);

      const result = await service.getWardSosEvents(guardianId, wardId);

      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe('sos-id');
      expect(result.data[0].triggerNotes).toBe('Help');
      expect(result.data[0].assignedStationName).toBe('Kathmandu');
      expect(result.data[0].lastLocation?.latitude).toBe(27.71);
    });
  });

  describe('getMyRequests', () => {
    it('USER: returns GUARDIAN_TO_CHILD requests where target_email matches child', async () => {
      const child = mockUser({ email: 'Child@Test.com' });
      const pendingRequest = mockGuardianRequest({
        direction: 'GUARDIAN_TO_CHILD',
        target_email: 'child@test.com',
        target_name: 'Child Name',
        requester_id: 'guardian-id',
      });

      userRepo.findOneBy.mockResolvedValue(child);
      requestRepo.find.mockResolvedValue([pendingRequest]);

      const result = await service.getMyRequests(userId, Role.USER);

      expect(userRepo.findOneBy).toHaveBeenCalledWith({ id: userId });
      expect(requestRepo.find).toHaveBeenCalledWith({
        where: {
          direction: 'GUARDIAN_TO_CHILD',
          target_email: 'child@test.com',
          status: 'PENDING',
        },
        order: { created_at: 'DESC' },
      });
      expect(result.requests).toHaveLength(1);
      expect(result.requests[0]).toMatchObject({
        id: pendingRequest.id,
        target_name: 'Child Name',
        target_email: 'child@test.com',
        direction: 'GUARDIAN_TO_CHILD',
        status: 'PENDING',
      });
    });

    it('USER: throws if child user not found', async () => {
      userRepo.findOneBy.mockResolvedValue(null);

      await expect(service.getMyRequests(userId, Role.USER)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('GUARDIAN: queries CHILD_TO_GUARDIAN by normalized target_email', async () => {
      const guardian = mockUser({
        id: 'guardian-id',
        email: 'Guardian@Test.com',
        role: Role.GUARDIAN,
      });
      const pendingRequest = mockGuardianRequest({
        direction: 'CHILD_TO_GUARDIAN',
        target_email: 'guardian@test.com',
      });

      userRepo.findOneBy.mockResolvedValue(guardian);
      requestRepo.find.mockResolvedValue([pendingRequest]);

      const result = await service.getMyRequests('guardian-id', Role.GUARDIAN);

      expect(requestRepo.find).toHaveBeenCalledWith({
        where: {
          target_email: 'guardian@test.com',
          direction: 'CHILD_TO_GUARDIAN',
          status: 'PENDING',
        },
        order: { created_at: 'DESC' },
      });
      expect(result.requests).toHaveLength(1);
      expect(result.requests[0]).toMatchObject({
        id: pendingRequest.id,
        requester_name: pendingRequest.requester_name,
        requester_id: pendingRequest.requester_id,
        direction: 'CHILD_TO_GUARDIAN',
      });
    });
  });

  describe('acceptRequest', () => {
    it('should throw if request not found', async () => {
      requestRepo.findOneBy.mockResolvedValue(null);
      await expect(
        service.acceptRequest('invalid-id', 'guardian-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if request already processed', async () => {
      requestRepo.findOneBy.mockResolvedValue(
        mockGuardianRequest({ status: 'ACCEPTED' }),
      );
      await expect(
        service.acceptRequest('request-id', 'guardian-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('CHILD_TO_GUARDIAN: guardian accepts and creates link with correct ids', async () => {
      const guardianId = 'guardian-id';
      const request = mockGuardianRequest({
        direction: 'CHILD_TO_GUARDIAN',
        requester_id: userId,
        target_email: 'guardian@test.com',
        status: 'PENDING',
      });
      const guardian = mockUser({
        id: guardianId,
        email: 'guardian@test.com',
        role: Role.GUARDIAN,
        phone_verified: false,
      });

      requestRepo.findOneBy.mockResolvedValue(request);
      userRepo.findOneBy.mockResolvedValue(guardian);
      linkRepo.findOne.mockResolvedValue(null);
      linkRepo.create.mockImplementation((data) => data as GuardianLink);
      linkRepo.save.mockImplementation(async (data) => data as GuardianLink);
      requestRepo.save.mockImplementation(async (data) => data as GuardianRequest);

      const result = await service.acceptRequest('request-id', guardianId);

      expect(result.message).toBe('Guardian request accepted successfully');
      expect(linkRepo.create).toHaveBeenCalledWith({
        child_user_id: userId,
        guardian_user_id: guardianId,
      });
      expect(linkRepo.save).toHaveBeenCalled();
      expect(requestRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ACCEPTED' }),
      );
    });

    it('GUARDIAN_TO_CHILD: child accepts and creates link with correct ids', async () => {
      const guardianId = 'guardian-id';
      const request = mockGuardianRequest({
        direction: 'GUARDIAN_TO_CHILD',
        requester_id: guardianId,
        target_email: 'user@test.com',
        status: 'PENDING',
      });
      const child = mockUser({
        id: userId,
        email: 'user@test.com',
        role: Role.USER,
      });

      requestRepo.findOneBy.mockResolvedValue(request);
      userRepo.findOneBy.mockResolvedValue(child);
      linkRepo.findOne.mockResolvedValue(null);
      linkRepo.create.mockImplementation((data) => data as GuardianLink);
      linkRepo.save.mockImplementation(async (data) => data as GuardianLink);
      requestRepo.save.mockImplementation(async (data) => data as GuardianRequest);

      const result = await service.acceptRequest('request-id', userId);

      expect(result.message).toBe('Child linked successfully as your ward');
      expect(linkRepo.create).toHaveBeenCalledWith({
        child_user_id: userId,
        guardian_user_id: guardianId,
      });
      expect(linkRepo.save).toHaveBeenCalled();
    });

    it('GUARDIAN_TO_CHILD: guardian (requester) cannot accept via child endpoint', async () => {
      const guardianId = 'guardian-id';
      const request = mockGuardianRequest({
        direction: 'GUARDIAN_TO_CHILD',
        requester_id: guardianId,
        target_email: 'user@test.com',
        status: 'PENDING',
      });
      const guardian = mockUser({
        id: guardianId,
        email: 'guardian@test.com',
        role: Role.GUARDIAN,
      });

      requestRepo.findOneBy.mockResolvedValue(request);
      userRepo.findOneBy.mockResolvedValue(guardian);

      await expect(
        service.acceptRequest('request-id', guardianId),
      ).rejects.toThrow(BadRequestException);
      expect(linkRepo.save).not.toHaveBeenCalled();
    });

    it('GUARDIAN_TO_CHILD: child with mismatched email cannot accept', async () => {
      const guardianId = 'guardian-id';
      const request = mockGuardianRequest({
        direction: 'GUARDIAN_TO_CHILD',
        requester_id: guardianId,
        target_email: 'other@test.com',
        status: 'PENDING',
      });
      const child = mockUser({
        id: userId,
        email: 'user@test.com',
        role: Role.USER,
      });

      requestRepo.findOneBy.mockResolvedValue(request);
      userRepo.findOneBy.mockResolvedValue(child);

      await expect(
        service.acceptRequest('request-id', userId),
      ).rejects.toThrow(BadRequestException);
      expect(linkRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('rejectRequest', () => {
    it('GUARDIAN_TO_CHILD: child can reject request addressed to them', async () => {
      const guardianId = 'guardian-id';
      const request = mockGuardianRequest({
        direction: 'GUARDIAN_TO_CHILD',
        requester_id: guardianId,
        target_email: 'user@test.com',
        status: 'PENDING',
      });
      const child = mockUser({
        id: userId,
        email: 'user@test.com',
        role: Role.USER,
      });

      requestRepo.findOneBy.mockResolvedValue(request);
      userRepo.findOneBy.mockResolvedValue(child);
      requestRepo.save.mockImplementation(async (data) => data as GuardianRequest);

      const result = await service.rejectRequest('request-id', userId);

      expect(result.message).toBe('Request rejected successfully');
      expect(requestRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'REJECTED' }),
      );
    });

    it('GUARDIAN_TO_CHILD: throws if request is not addressed to acting user', async () => {
      const request = mockGuardianRequest({
        direction: 'GUARDIAN_TO_CHILD',
        requester_id: 'guardian-id',
        target_email: 'other@test.com',
        status: 'PENDING',
      });

      requestRepo.findOneBy.mockResolvedValue(request);
      userRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.rejectRequest('request-id', userId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
