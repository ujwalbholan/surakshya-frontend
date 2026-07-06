import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let refresh: jest.Mock;

  beforeEach(async () => {
    refresh = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            forgetPassword: jest.fn(),
            verifyResetOtp: jest.fn(),
            resetPassword: jest.fn(),
            refresh,
            logout: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should rotate tokens and replace authentication cookies', async () => {
    const cookie = jest.fn();
    const request = {
      cookies: { refresh_token: 'old-refresh-token' },
    } as unknown as Request;
    const response = { cookie } as unknown as Response;

    refresh.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      sessionId: 'new-session-id',
    });

    await controller.refresh(request, response);

    expect(refresh).toHaveBeenCalledWith('old-refresh-token');
    expect(cookie).toHaveBeenCalledWith(
      'access_token',
      'new-access-token',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(cookie).toHaveBeenCalledWith(
      'refresh_token',
      'new-refresh-token',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('should reject refresh requests without a refresh cookie', async () => {
    const request = { cookies: {} } as Request;
    const response = { cookie: jest.fn() } as unknown as Response;

    await expect(controller.refresh(request, response)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
