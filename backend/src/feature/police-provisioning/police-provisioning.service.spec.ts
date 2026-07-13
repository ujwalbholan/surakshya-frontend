/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  PoliceAccountStatus,
  PoliceStationLinkStatus,
  POLICE_LOGIN_BLOCKED_REASON,
} from 'src/constants/police-provisioning.constants';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { User } from 'src/feature/user/entities/user.entity';
import { PoliceStation } from 'src/feature/police-stations/entities/police-station.entity';
import { NotificationService } from 'src/feature/notification/notification.service';
import { OtpEmailService } from 'src/feature/notification/email/otp.email';
import { RedisService } from 'src/config/redis/redis.service';
import { PoliceStationLink } from './entities/police-station-link.entity';
import { PoliceProvisioningService } from './police-provisioning.service';
import {
  policeActivationChallengeKey,
  policeActivationOtpKey,
} from './police-provisioning.types';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-value'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('PoliceProvisioningService', () => {
  let service: PoliceProvisioningService;
  let userRepo: jest.Mocked<Repository<User>>;
  let linkRepo: jest.Mocked<Repository<PoliceStationLink>>;
  let stationRepo: jest.Mocked<Repository<PoliceStation>>;
  let notificationService: jest.Mocked<NotificationService>;
  let otpEmailService: jest.Mocked<OtpEmailService>;
  let redisService: jest.Mocked<RedisService>;
  let queryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    manager: {
      save: jest.Mock;
      create: jest.Mock;
    };
  };

  const adminId = 'admin-id';
  const officerId = 'officer-id';
  const stationId = 'station-id';
  const linkId = 'link-id';

  const mockOfficer = (overrides: Partial<User> = {}): User =>
    ({
      id: officerId,
      full_name: 'Inspector Ram',
      email: 'ram@police.gov.np',
      phone: '9800000001',
      password_hash: null,
      role: Role.POLICE,
      is_active: false,
      phone_verified: false,
      police_account_status: PoliceAccountStatus.PENDING_ACTIVATION,
      must_change_password: true,
      temp_password_hash: 'hashed-temp',
      temp_password_expires_at: new Date(Date.now() + 60 * 60 * 1000),
      temp_password_resend_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    }) as User;

  const mockLink = (
    overrides: Partial<PoliceStationLink> = {},
  ): PoliceStationLink => ({
    id: linkId,
    requested_by_admin_id: adminId,
    officer_id: officerId,
    station_id: stationId,
    status: PoliceStationLinkStatus.PENDING,
    officer: mockOfficer(),
    station: {
      id: stationId,
      name: 'Central Station',
      address: 'Kathmandu',
      contact_number: '9800000000',
      created_at: new Date(),
      updated_at: new Date(),
    },
    requested_by_admin: {
      id: adminId,
      full_name: 'Admin User',
      email: 'admin@surakshya.com',
    } as User,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
        create: jest.fn((_, data: unknown) => data),
      },
    };

    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoliceProvisioningService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PoliceStationLink),
          useValue: {
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PoliceStation),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: NotificationService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: OtpEmailService,
          useValue: {
            sendPasswordResetOtp: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: RedisService,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
            incr: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get(PoliceProvisioningService);
    userRepo = module.get(getRepositoryToken(User));
    linkRepo = module.get(getRepositoryToken(PoliceStationLink));
    stationRepo = module.get(getRepositoryToken(PoliceStation));
    notificationService = module.get(NotificationService);
    otpEmailService = module.get(OtpEmailService);
    redisService = module.get(RedisService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPoliceAccount', () => {
    it('creates user and pending link without returning password', async () => {
      stationRepo.findOneBy.mockResolvedValue({
        id: stationId,
      } as PoliceStation);
      userRepo.findOne.mockResolvedValue(null);

      queryRunner.manager.save
        .mockResolvedValueOnce({ id: officerId })
        .mockResolvedValueOnce({ id: linkId });

      const result = await service.createPoliceAccount(adminId, {
        full_name: 'Inspector Ram',
        email: 'ram@police.gov.np',
        phone: '+9779800000001',
        station_id: stationId,
      });

      expect(result).toEqual({
        message: 'Police officer account created successfully',
        email: 'ram@police.gov.np',
        user_id: officerId,
      });
      expect(result).not.toHaveProperty('password');
      expect(notificationService.sendEmail).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('rejects duplicate email', async () => {
      stationRepo.findOneBy.mockResolvedValue({
        id: stationId,
      } as PoliceStation);
      userRepo.findOne.mockResolvedValue(mockOfficer());

      await expect(
        service.createPoliceAccount(adminId, {
          full_name: 'Inspector Ram',
          email: 'ram@police.gov.np',
          phone: '+9779800000001',
          station_id: stationId,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('approveStationLink', () => {
    it('approves a pending link for super admin', async () => {
      userRepo.findOneBy.mockResolvedValue({
        id: 'super-admin-id',
        role: Role.SUPER_ADMIN,
      } as User);
      linkRepo.findOne.mockResolvedValue(mockLink());
      linkRepo.save.mockImplementation((link) =>
        Promise.resolve(link as PoliceStationLink),
      );

      const result = await service.approveStationLink('super-admin-id', linkId);

      expect(result.message).toBe('Station link approved successfully');
      expect(linkRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PoliceStationLinkStatus.APPROVED,
        }),
      );
    });

    it('rejects non-super-admin callers', async () => {
      userRepo.findOneBy.mockResolvedValue({
        id: adminId,
        role: Role.ADMIN,
      } as User);

      await expect(
        service.approveStationLink(adminId, linkId),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('rejectStationLink', () => {
    it('rejects link and suspends officer', async () => {
      userRepo.findOneBy.mockResolvedValue({
        id: 'super-admin-id',
        role: Role.SUPER_ADMIN,
      } as User);
      linkRepo.findOne.mockResolvedValue(mockLink());
      linkRepo.save.mockImplementation((link) =>
        Promise.resolve(link as PoliceStationLink),
      );

      const result = await service.rejectStationLink(
        'super-admin-id',
        linkId,
        'Invalid assignment',
      );

      expect(result.message).toBe('Station link rejected successfully');
      expect(userRepo.update).toHaveBeenCalledWith(
        { id: officerId },
        {
          police_account_status: PoliceAccountStatus.SUSPENDED,
          is_active: false,
        },
      );
      expect(notificationService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('evaluatePoliceLogin', () => {
    it('returns null for non-police users', async () => {
      const result = await service.evaluatePoliceLogin(
        mockOfficer({ role: Role.USER }),
        'password',
      );

      expect(result).toBeNull();
    });

    it('blocks login when station link is pending', async () => {
      linkRepo.findOne.mockResolvedValue(
        mockLink({ status: PoliceStationLinkStatus.PENDING }),
      );

      await expect(
        service.evaluatePoliceLogin(mockOfficer(), 'temp-password'),
      ).rejects.toMatchObject({
        response: {
          code: POLICE_LOGIN_BLOCKED_REASON.LINK_PENDING,
        },
      });
    });

    it('returns challenge token when temp password is valid and link approved', async () => {
      linkRepo.findOne.mockResolvedValue(
        mockLink({ status: PoliceStationLinkStatus.APPROVED }),
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      redisService.set.mockResolvedValue('OK');

      const result = await service.evaluatePoliceLogin(
        mockOfficer(),
        'temp-password',
      );

      expect(result).toEqual({
        message: 'Password change required before activation',
        requiresPasswordChange: true,
        challengeToken: expect.any(String) as string,
      });
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('police:activation:challenge:'),
        officerId,
        expect.any(Number),
      );
    });

    it('resumes OTP activation when password already set but status pending', async () => {
      linkRepo.findOne.mockResolvedValue(
        mockLink({ status: PoliceStationLinkStatus.APPROVED }),
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      redisService.set.mockResolvedValue('OK');
      redisService.incr.mockResolvedValue(1);
      userRepo.findOne.mockResolvedValue(
        mockOfficer({
          must_change_password: false,
          police_account_status: PoliceAccountStatus.PENDING_ACTIVATION,
          password_hash: 'hashed-permanent',
          temp_password_hash: null,
        }),
      );

      const result = await service.evaluatePoliceLogin(
        mockOfficer({
          must_change_password: false,
          police_account_status: PoliceAccountStatus.PENDING_ACTIVATION,
          password_hash: 'hashed-permanent',
          temp_password_hash: null,
        }),
        'new-password-123',
      );

      expect(result).toEqual({
        message:
          'Account activation incomplete. Enter the OTP sent to your email.',
        requiresActivationOtp: true,
        challengeToken: expect.any(String) as string,
      });
      expect(otpEmailService.sendPasswordResetOtp).toHaveBeenCalled();
    });

    it('blocks suspended officers', async () => {
      await expect(
        service.evaluatePoliceLogin(
          mockOfficer({
            police_account_status: PoliceAccountStatus.SUSPENDED,
          }),
          'password',
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('completePoliceActivation', () => {
    it('sets password and sends OTP', async () => {
      redisService.get.mockResolvedValue(officerId);
      userRepo.findOne.mockResolvedValue(mockOfficer());
      redisService.incr.mockResolvedValue(1);

      const result = await service.completePoliceActivation(
        'challenge-token',
        'new-password-123',
      );

      expect(result).toEqual({
        message: 'Password updated. OTP sent to your email.',
        otpSent: true,
      });
      expect(userRepo.update).toHaveBeenCalledWith(
        { id: officerId },
        expect.objectContaining({
          must_change_password: false,
          temp_password_hash: null,
        }),
      );
      expect(otpEmailService.sendPasswordResetOtp).toHaveBeenCalled();
    });

    it('rejects short passwords', async () => {
      redisService.get.mockResolvedValue(officerId);
      userRepo.findOne.mockResolvedValue(mockOfficer());

      await expect(
        service.completePoliceActivation('challenge-token', 'short'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('verifyPoliceActivationOtp', () => {
    it('activates officer and clears challenge token', async () => {
      redisService.get.mockResolvedValue(officerId);
      userRepo.findOne.mockResolvedValue(
        mockOfficer({ must_change_password: false }),
      );
      redisService.incr.mockResolvedValue(1);
      linkRepo.findOne.mockResolvedValue(
        mockLink({ status: PoliceStationLinkStatus.APPROVED }),
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.verifyPoliceActivationOtp(
        'challenge-token',
        '123456',
      );

      expect(result.message).toContain('activated successfully');
      expect(userRepo.update).toHaveBeenCalledWith(
        { id: officerId },
        {
          police_account_status: PoliceAccountStatus.ACTIVE,
          is_active: true,
          station_id: stationId,
        },
      );
      expect(redisService.del).toHaveBeenCalledWith(
        policeActivationChallengeKey('challenge-token'),
      );
      expect(redisService.del).toHaveBeenCalledWith(
        policeActivationOtpKey('challenge-token'),
      );
    });
  });

  describe('resendTempPassword', () => {
    it('regenerates temp password for pending officer', async () => {
      userRepo.findOne.mockResolvedValue(mockOfficer());

      const result = await service.resendTempPassword(adminId, officerId);

      expect(result.message).toBe('Temporary password resent successfully');
      expect(userRepo.update).toHaveBeenCalled();
      expect(notificationService.sendEmail).toHaveBeenCalled();
    });

    it('rejects resend for active officers', async () => {
      userRepo.findOne.mockResolvedValue(
        mockOfficer({ police_account_status: PoliceAccountStatus.ACTIVE }),
      );

      await expect(
        service.resendTempPassword(adminId, officerId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('enforces cooldown between resends', async () => {
      userRepo.findOne.mockResolvedValue(
        mockOfficer({
          temp_password_last_resend_at: new Date(),
          temp_password_resend_count: 1,
        }),
      );

      await expect(
        service.resendTempPassword(adminId, officerId),
      ).rejects.toBeInstanceOf(HttpException);
    });
  });

  describe('listPendingStationLinks', () => {
    it('returns pending links for super admin', async () => {
      userRepo.findOneBy.mockResolvedValue({
        id: 'super-admin-id',
        role: Role.SUPER_ADMIN,
      } as User);
      linkRepo.findAndCount.mockResolvedValue([[mockLink()], 1]);

      const result = await service.listPendingStationLinks('super-admin-id');

      expect(result.total).toBe(1);
      expect(result.links).toHaveLength(1);
    });

    it('rejects non-super-admin callers', async () => {
      userRepo.findOneBy.mockResolvedValue({
        id: adminId,
        role: Role.ADMIN,
      } as User);

      await expect(
        service.listPendingStationLinks(adminId),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
