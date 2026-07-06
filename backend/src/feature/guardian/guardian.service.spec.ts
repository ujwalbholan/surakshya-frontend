/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/feature/user/entities/user.entity';
import { GuardianLink } from './entities/guardian-link.entity';
import { GuardianRequest } from './entities/guardian-request.entity';
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
  });
});
