import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { EmailService } from './email.service';

describe('EmailService', () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: 're_test_key',
      RESEND_MAIL_FROM: 'Surakshya <noreply@example.com>',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('should send email through the Resend HTTPS API', async () => {
    let requestUrl: string | undefined;
    let requestInit: RequestInit | undefined;
    globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      let url: string;

      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof URL) {
        url = input.href;
      } else {
        url = input.url;
      }

      requestUrl = url;
      requestInit = init;

      return Promise.resolve(
        new Response(JSON.stringify({ id: 'email-id' }), {
          status: 200,
        }),
      );
    };
    const service = new EmailService();

    await service.send({
      to: 'user@example.com',
      subject: 'Welcome',
      text: 'Welcome',
      html: '<p>Welcome</p>',
    });

    expect(requestUrl).toBe('https://api.resend.com/emails');
    expect(requestInit?.method).toBe('POST');
    expect(requestInit?.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer re_test_key',
        'User-Agent': 'surakshya-backend/1.0',
      }),
    );
    expect(JSON.parse(requestInit?.body as string)).toEqual({
      from: 'Surakshya <noreply@example.com>',
      to: 'user@example.com',
      subject: 'Welcome',
      text: 'Welcome',
      html: '<p>Welcome</p>',
    });
  });

  it('should convert Resend API failures into a service error in production', async () => {
    process.env.NODE_ENV = 'production';
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response('Domain is not verified', { status: 422 }),
      ) as typeof fetch;
    const service = new EmailService();

    await expect(
      service.send({
        to: 'user@example.com',
        subject: 'Welcome',
        text: 'Welcome',
        html: '<p>Welcome</p>',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('should fall back to console log in non-production when Resend fails', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response('Domain is not verified', { status: 422 }),
      ) as typeof fetch;
    const service = new EmailService();

    await expect(
      service.send({
        to: 'user@example.com',
        subject: 'Welcome',
        text: 'Welcome',
        html: '<p>Welcome</p>',
      }),
    ).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('falling back to console'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Email stub]'),
    );
  });
});
