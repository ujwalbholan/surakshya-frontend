import { EmailMessage, EmailService } from '../email.service';
import { WelcomeEmailService } from './welcome.email';

describe('WelcomeEmailService', () => {
  it('should send a welcome email and escape the name in HTML', async () => {
    let sentMessage: EmailMessage | undefined;
    const emailService = {
      send: (message: EmailMessage) => {
        sentMessage = message;
        return Promise.resolve();
      },
    } as EmailService;
    const service = new WelcomeEmailService(emailService);

    await service.sendWelcomeEmail('user@example.com', '<Ujwal>');

    expect(sentMessage).toBeDefined();

    if (sentMessage) {
      expect(sentMessage.to).toBe('user@example.com');
      expect(sentMessage.subject).toBe('Welcome to Surakshya');
      expect(sentMessage.text).toContain('<Ujwal>');
      expect(sentMessage.html).toContain('&lt;Ujwal&gt;');
    }
  });
});
