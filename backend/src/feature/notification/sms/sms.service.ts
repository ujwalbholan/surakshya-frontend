import { Injectable, Logger } from '@nestjs/common';
import Twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly client?: Twilio.Twilio;
  private readonly from?: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.from = process.env.TWILIO_PHONE_NUMBER;

    if (accountSid && authToken && this.from) {
      this.client = Twilio(accountSid, authToken);
    } else {
      this.logger.warn(
        'Twilio is not configured — SMS will be logged to console only',
      );
    }
  }

  async send(phone: string, message: string): Promise<void> {
    if (!this.client) {
      this.logger.log(`[SMS stub] To: ${phone} — ${message}`);
      return;
    }

    try {
      await this.client.messages.create({
        body: message,
        from: this.from,
        to: phone,
      });
      this.logger.log(`SMS sent to ${phone}`);
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown Twilio error';
      this.logger.error(`Failed to send SMS to ${phone}: ${reason}`);
      throw error;
    }
  }
}
