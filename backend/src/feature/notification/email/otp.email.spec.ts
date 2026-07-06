import { EmailMessage, EmailService } from '../email.service';
import { OtpEmailService } from './otp.email';

describe('OtpEmailService', () => {
  it('should send the password reset OTP through EmailService', async () => {
    let sentMessage: EmailMessage | undefined;
    const emailService = {
      send: (message: EmailMessage) => {
        sentMessage = message;
        return Promise.resolve();
      },
    } as EmailService;
    const service = new OtpEmailService(emailService);

    await service.sendPasswordResetOtp('user@example.com', '123456');

    expect(sentMessage).toBeDefined();

    if (sentMessage) {
      expect(sentMessage.to).toBe('user@example.com');
      expect(sentMessage.subject).toBe('Password Reset OTP');
      expect(sentMessage.text).toContain('123456');
      expect(sentMessage.html).toContain('123456');
    }
  });
});
