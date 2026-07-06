/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from 'src/config/redis/redis.service';
import { OtpEmailService } from 'src/feature/notification/email/otp.email';
import { WelcomeEmailService } from 'src/feature/notification/email/welcome.email';
import { UserService } from 'src/feature/user/user.service';
import { TokenService } from 'src/utils/token/token.service';
import { AuthService } from './auth.service';
import { Role } from './dto/auth.dto';

describe('AuthService', () => {
  let service: AuthService;
  let tokenService: jest.Mocked<TokenService>;
  let userService: jest.Mocked<UserService>;
  let redisService: jest.Mocked<RedisService>;
  let otpEmailService: jest.Mocked<OtpEmailService>;
  let welcomeEmailService: jest.Mocked<WelcomeEmailService>;

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: TokenService,
          useValue: {
            revokedRefreshToken: jest.fn(),
            rotateRefreshToken: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            register: jest.fn(),
            findOneByEmail: jest.fn(),
            updatePassword: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: OtpEmailService,
          useValue: {
            sendPasswordResetOtp: jest.fn(),
          },
        },
        {
          provide: WelcomeEmailService,
          useValue: {
            sendWelcomeEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    tokenService = module.get(TokenService);
    userService = module.get(UserService);
    redisService = module.get(RedisService);
    otpEmailService = module.get(OtpEmailService);
    welcomeEmailService = module.get(WelcomeEmailService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send a welcome email after registration', async () => {
    const dto = {
      full_name: 'Ujwal Bholan',
      email: 'ujwal@example.com',
      phone: '9800000000',
      password: 'password123',
      role: Role.USER,
    };

    userService.register.mockResolvedValue({
      id: 'user-id',
      full_name: dto.full_name,
      email: dto.email,
      phone: dto.phone,
      role: dto.role,
    } as never);
    welcomeEmailService.sendWelcomeEmail.mockResolvedValue(undefined);

    const result = await service.register(dto);

    expect(welcomeEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
      dto.email,
      dto.full_name,
    );
    expect(result.message).toBe('User Registered successfully');
  });

  it('should not send a welcome email when registration fails', async () => {
    const dto = {
      full_name: 'Ujwal Bholan',
      email: 'ujwal@example.com',
      phone: '9800000000',
      password: 'password123',
      role: Role.USER,
    };

    userService.register.mockRejectedValue(
      new Error('Database registration failed'),
    );

    await expect(service.register(dto)).rejects.toThrow(
      'Database registration failed',
    );
    expect(welcomeEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('should keep registration successful when welcome email fails', async () => {
    const dto = {
      full_name: 'Ujwal Bholan',
      email: 'ujwal@example.com',
      phone: '9800000000',
      password: 'password123',
      role: Role.USER,
    };

    userService.register.mockResolvedValue({
      id: 'user-id',
      full_name: dto.full_name,
      email: dto.email,
      phone: dto.phone,
      role: dto.role,
    } as never);
    welcomeEmailService.sendWelcomeEmail.mockRejectedValue(
      new Error('SMTP unavailable'),
    );

    await expect(service.register(dto)).resolves.toMatchObject({
      message: 'User Registered successfully',
      user_id: 'user-id',
    });
  });

  it('should send a password reset OTP email', async () => {
    userService.findOneByEmail.mockResolvedValue({
      email: 'ujwal@example.com',
    } as never);
    redisService.set.mockResolvedValue('OK');
    otpEmailService.sendPasswordResetOtp.mockResolvedValue(undefined);

    const result = await service.forgotPassword('ujwal@example.com');

    expect(otpEmailService.sendPasswordResetOtp).toHaveBeenCalledWith(
      'ujwal@example.com',
      expect.stringMatching(/^\d{6}$/),
    );
    expect(result).toEqual({ message: 'Otp sent successfully' });
  });

  it('should revoke the current refresh token on logout', async () => {
    tokenService.revokedRefreshToken.mockResolvedValue(1);

    await expect(
      service.logout('user-id', 'session-id'),
    ).resolves.toBeUndefined();

    expect(tokenService.revokedRefreshToken).toHaveBeenCalledWith(
      'user-id',
      'session-id',
    );
  });

  it('should rotate the refresh token', async () => {
    tokenService.rotateRefreshToken.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
    });

    const result = await service.refresh('old-refresh-token');

    expect(tokenService.rotateRefreshToken).toHaveBeenCalledWith(
      'old-refresh-token',
    );
    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
    });
  });

  it('should reset password with the plain new password once reset token is valid', async () => {
    const dto = {
      email: 'ujwalbholan@gmail.com',
      newPassword: 'test@12345',
      comparePassword: 'test@12345',
      resetToken: 'reset-token',
    };

    redisService.get.mockResolvedValue(dto.email);
    userService.findOneByEmail.mockResolvedValue({ id: 'user-id' } as never);
    userService.updatePassword.mockResolvedValue(undefined);
    redisService.del.mockResolvedValue(1);

    const result = await service.resetPassword(dto);

    expect(redisService.get).toHaveBeenCalledWith('password:reset:reset-token');
    expect(userService.updatePassword).toHaveBeenCalledWith(
      dto.email,
      dto.newPassword,
    );
    expect(redisService.del).toHaveBeenCalledWith('password:reset:reset-token');
    expect(result).toEqual({
      message: 'Password reset successfully',
    });
  });
});
