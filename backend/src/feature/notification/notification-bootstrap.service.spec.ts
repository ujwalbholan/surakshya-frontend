import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import {
  NotificationBootstrapError,
  NotificationBootstrapService,
} from './notification-bootstrap.service';

const fetchAccount = jest.fn();

jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    api: {
      accounts: jest.fn().mockReturnValue({
        fetch: fetchAccount,
      }),
    },
  }));
});

describe('NotificationBootstrapService', () => {
  const originalFetch = globalThis.fetch;
  let configValues: Record<string, string | undefined>;
  let configService: ConfigService;

  beforeEach(() => {
    configValues = { NODE_ENV: 'production' };
    configService = {
      get: jest.fn((key: string) => configValues[key]),
    } as unknown as ConfigService;
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    fetchAccount.mockReset();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function createService() {
    return new NotificationBootstrapService(configService);
  }

  it('skips validation outside production', async () => {
    configValues.NODE_ENV = 'development';
    const service = createService();

    await expect(service.validateOrThrow()).resolves.toBeUndefined();
  });

  it('refuses to start in production when no notification channel is configured', async () => {
    const service = createService();

    await expect(service.validateOrThrow()).rejects.toThrow(
      NotificationBootstrapError,
    );
    await expect(service.validateOrThrow()).rejects.toThrow(
      'TWILIO_ACCOUNT_SID',
    );
    await expect(service.validateOrThrow()).rejects.toThrow('MAIL_HOST');
  });

  it('validates Twilio credentials when SMS is configured', async () => {
    configValues = {
      NODE_ENV: 'production',
      TWILIO_ACCOUNT_SID: 'AC' + 'a'.repeat(32),
      TWILIO_AUTH_TOKEN: 'secret-token',
      TWILIO_PHONE_NUMBER: '+9779800000000',
    };
    fetchAccount.mockResolvedValue({ sid: configValues.TWILIO_ACCOUNT_SID });

    const service = createService();
    await expect(service.validateOrThrow()).resolves.toBeUndefined();
    expect(fetchAccount).toHaveBeenCalled();
  });

  it('validates Resend credentials when email is configured', async () => {
    configValues = {
      NODE_ENV: 'production',
      RESEND_API_KEY: 're_test_key',
      RESEND_MAIL_FROM: 'Surakshya <noreply@example.com>',
    };

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('[]'),
    }) as typeof fetch;

    const service = createService();
    await expect(service.validateOrThrow()).resolves.toBeUndefined();
    const fetchMock = globalThis.fetch as jest.Mock;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer re_test_key',
      }),
    );
  });

  it('rejects invalid Resend API keys in production', async () => {
    configValues = {
      NODE_ENV: 'production',
      RESEND_API_KEY: 're_bad_key',
      RESEND_MAIL_FROM: 'Surakshya <noreply@example.com>',
    };

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    }) as typeof fetch;

    const service = createService();
    await expect(service.validateOrThrow()).rejects.toThrow(
      'Resend API key is invalid or unauthorized',
    );
  });

  it('refuses application bootstrap in production when credentials are missing', async () => {
    const originalEnv = { ...process.env };
    process.env.NODE_ENV = 'production';
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_MAIL_FROM;
    delete process.env.MAIL_HOST;
    delete process.env.MAIL_PORT;
    delete process.env.MAIL_USER;
    delete process.env.MAIL_PASSWORD;
    delete process.env.MAIL_FROM;

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [NotificationBootstrapService],
    }).compile();

    const app = moduleRef.createNestApplication();

    try {
      await expect(app.init()).rejects.toBeInstanceOf(
        NotificationBootstrapError,
      );
    } finally {
      process.env = originalEnv;
      await app.close();
    }
  });
});
