import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import Twilio from 'twilio';

export class NotificationBootstrapError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotificationBootstrapError';
  }
}

interface SmsConfig {
  accountSid: string;
  authToken: string;
  from: string;
}

interface ResendConfig {
  apiKey: string;
  from: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

@Injectable()
export class NotificationBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(NotificationBootstrapService.name);

  constructor(private readonly configService: ConfigService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.validateOrThrow();
  }

  async validateOrThrow(): Promise<void> {
    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      return;
    }

    const smsConfig = this.getSmsConfig();
    const resendConfig = this.getResendConfig();
    const smtpConfig = this.getSmtpConfig();

    const smsReady = smsConfig !== null;
    const emailReady = resendConfig !== null || smtpConfig !== null;

    if (!smsReady && !emailReady) {
      const missing = this.describeMissingChannels(
        smsConfig,
        resendConfig,
        smtpConfig,
      );
      throw new NotificationBootstrapError(
        `Production startup blocked: no valid notification channel configured. Missing: ${missing.join('; ')}`,
      );
    }

    if (smsConfig) {
      await this.validateTwilioCredentials(smsConfig);
      this.logger.log('Twilio SMS credentials validated');
    }

    if (resendConfig) {
      await this.validateResendCredentials(resendConfig);
      this.logger.log('Resend email credentials validated');
    } else if (smtpConfig) {
      await this.validateSmtpCredentials(smtpConfig);
      this.logger.log('SMTP email credentials validated');
    }
  }

  private getSmsConfig(): SmsConfig | null {
    const accountSid = this.configService
      .get<string>('TWILIO_ACCOUNT_SID')
      ?.trim();
    const authToken = this.configService
      .get<string>('TWILIO_AUTH_TOKEN')
      ?.trim();
    const from = this.configService.get<string>('TWILIO_PHONE_NUMBER')?.trim();

    if (!accountSid && !authToken && !from) {
      return null;
    }

    const missing: string[] = [];
    if (!accountSid) missing.push('TWILIO_ACCOUNT_SID');
    if (!authToken) missing.push('TWILIO_AUTH_TOKEN');
    if (!from) missing.push('TWILIO_PHONE_NUMBER');

    if (missing.length > 0) {
      return null;
    }

    if (!/^AC[a-f0-9]{32}$/i.test(accountSid!)) {
      return null;
    }

    if (!/^\+[1-9]\d{6,14}$/.test(from!)) {
      return null;
    }

    return {
      accountSid: accountSid!,
      authToken: authToken!,
      from: from!,
    };
  }

  private getResendConfig(): ResendConfig | null {
    const apiKey = this.configService.get<string>('RESEND_API_KEY')?.trim();
    const from = this.configService.get<string>('RESEND_MAIL_FROM')?.trim();

    if (!apiKey && !from) {
      return null;
    }

    if (!apiKey || !from) {
      return null;
    }

    return { apiKey, from };
  }

  private getSmtpConfig(): SmtpConfig | null {
    const host = this.configService.get<string>('MAIL_HOST')?.trim();
    const portRaw = this.configService.get<string>('MAIL_PORT')?.trim();
    const user = this.configService.get<string>('MAIL_USER')?.trim();
    const password = this.configService.get<string>('MAIL_PASSWORD')?.trim();
    const from = this.configService.get<string>('MAIL_FROM')?.trim();

    if (!host && !portRaw && !user && !password && !from) {
      return null;
    }

    if (!host || !portRaw || !user || !password || !from) {
      return null;
    }

    const port = Number(portRaw);
    if (!Number.isFinite(port) || port <= 0) {
      return null;
    }

    return {
      host,
      port,
      secure: this.configService.get<string>('MAIL_SECURE') === 'true',
      user,
      password,
      from,
    };
  }

  private describeMissingChannels(
    smsConfig: SmsConfig | null,
    resendConfig: ResendConfig | null,
    smtpConfig: SmtpConfig | null,
  ): string[] {
    const missing: string[] = [];

    const accountSid = this.configService
      .get<string>('TWILIO_ACCOUNT_SID')
      ?.trim();
    const authToken = this.configService
      .get<string>('TWILIO_AUTH_TOKEN')
      ?.trim();
    const from = this.configService.get<string>('TWILIO_PHONE_NUMBER')?.trim();

    if (!smsConfig) {
      if (!accountSid) missing.push('TWILIO_ACCOUNT_SID');
      if (!authToken) missing.push('TWILIO_AUTH_TOKEN');
      if (!from) missing.push('TWILIO_PHONE_NUMBER');
      if (accountSid && !/^AC[a-f0-9]{32}$/i.test(accountSid)) {
        missing.push('TWILIO_ACCOUNT_SID (invalid format)');
      }
      if (from && !/^\+[1-9]\d{6,14}$/.test(from)) {
        missing.push('TWILIO_PHONE_NUMBER (invalid E.164 format)');
      }
    }

    const resendKey = this.configService.get<string>('RESEND_API_KEY')?.trim();
    const resendFrom = this.configService
      .get<string>('RESEND_MAIL_FROM')
      ?.trim();
    const mailHost = this.configService.get<string>('MAIL_HOST')?.trim();
    const mailPort = this.configService.get<string>('MAIL_PORT')?.trim();
    const mailUser = this.configService.get<string>('MAIL_USER')?.trim();
    const mailPassword = this.configService
      .get<string>('MAIL_PASSWORD')
      ?.trim();
    const mailFrom = this.configService.get<string>('MAIL_FROM')?.trim();

    if (!resendConfig && !smtpConfig) {
      if (resendKey && !resendFrom) missing.push('RESEND_MAIL_FROM');
      if (!resendKey && resendFrom) missing.push('RESEND_API_KEY');
      if (!resendKey && !resendFrom) {
        if (!mailHost) missing.push('MAIL_HOST');
        if (!mailPort) missing.push('MAIL_PORT');
        if (!mailUser) missing.push('MAIL_USER');
        if (!mailPassword) missing.push('MAIL_PASSWORD');
        if (!mailFrom) missing.push('MAIL_FROM');
      }
    }

    return missing;
  }

  private async validateTwilioCredentials(config: SmsConfig): Promise<void> {
    try {
      const client = Twilio(config.accountSid, config.authToken);
      await client.api.accounts(config.accountSid).fetch();
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown Twilio error';
      throw new NotificationBootstrapError(
        `Production startup blocked: Twilio authentication failed (${reason})`,
      );
    }
  }

  private async validateResendCredentials(config: ResendConfig): Promise<void> {
    try {
      const response = await fetch('https://api.resend.com/domains', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'User-Agent': 'surakshya-backend/1.0',
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (response.status === 401 || response.status === 403) {
        throw new NotificationBootstrapError(
          'Production startup blocked: Resend API key is invalid or unauthorized',
        );
      }

      if (!response.ok) {
        const details = await response.text();
        throw new NotificationBootstrapError(
          `Production startup blocked: Resend API validation failed (${response.status}: ${details})`,
        );
      }
    } catch (error) {
      if (error instanceof NotificationBootstrapError) {
        throw error;
      }

      const reason =
        error instanceof Error ? error.message : 'Unknown Resend API error';
      throw new NotificationBootstrapError(
        `Production startup blocked: unable to reach Resend API (${reason})`,
      );
    }
  }

  private async validateSmtpCredentials(config: SmtpConfig): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });

    try {
      await transporter.verify();
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown SMTP error';
      throw new NotificationBootstrapError(
        `Production startup blocked: SMTP authentication failed (${reason})`,
      );
    }
  }
}
