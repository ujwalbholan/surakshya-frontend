import { Injectable, Logger } from '@nestjs/common';
import Twilio from 'twilio';

export interface EmergencyVoiceCall {
  to: string;
  wardName: string;
  sosEventId: string;
}

/**
 * Places server-side emergency calls. A mobile app cannot reliably start
 * simultaneous PSTN calls; Twilio must originate one independent call per
 * emergency contact.
 */
@Injectable()
export class VoiceCallService {
  private readonly logger = new Logger(VoiceCallService.name);
  private readonly client?: Twilio.Twilio;
  private readonly from?: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.from =
      process.env.TWILIO_VOICE_PHONE_NUMBER ??
      process.env.TWILIO_PHONE_NUMBER;

    if (accountSid && authToken && this.from) {
      this.client = Twilio(accountSid, authToken);
    } else {
      this.logger.warn(
        'Twilio Voice is not configured — emergency calls will be logged only',
      );
    }
  }

  async callEmergencyContact(input: EmergencyVoiceCall): Promise<void> {
    const to = this.toE164(input.to);
    const message =
      `Emergency alert from Surakshya. ${input.wardName} has triggered an SOS. ` +
      'Open the Surakshya guardian app now to view their live location.';

    if (!this.client || !this.from) {
      this.logger.log(
        `[VOICE stub] To: ${to} — SOS: ${input.sosEventId} — ${message}`,
      );
      return;
    }

    try {
      const call = await this.client.calls.create({
        to,
        from: this.from,
        twiml:
          '<Response><Say voice="alice" language="en-US">' +
          `${this.escapeXml(message)}</Say><Pause length="1"/>` +
          '<Say voice="alice" language="en-US">This message will now repeat.</Say>' +
          `<Say voice="alice" language="en-US">${this.escapeXml(message)}</Say>` +
          '</Response>',
      });
      this.logger.log(
        `Emergency voice call created for ${to} (${call.sid}, SOS ${input.sosEventId})`,
      );
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown Twilio error';
      this.logger.error(
        `Emergency voice call failed for ${to} (SOS ${input.sosEventId}): ${reason}`,
      );
      throw error;
    }
  }

  private toE164(phone: string): string {
    const trimmed = phone.trim();
    if (trimmed.startsWith('+')) return trimmed;

    const digits = trimmed.replace(/\D/g, '');
    if (digits.startsWith('977')) return `+${digits}`;
    if (digits.length === 10 && digits.startsWith('9')) {
      return `+977${digits}`;
    }
    return `+${digits}`;
  }

  private escapeXml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }
}
