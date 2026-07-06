import { Injectable } from '@nestjs/common';
import { EmailService } from '../email.service';

@Injectable()
export class WelcomeEmailService {
  constructor(private readonly emailService: EmailService) {}

  async sendWelcomeEmail(email: string, fullName: string): Promise<void> {
    const safeFullName = this.escapeHtml(fullName);

    await this.emailService.send({
      to: email,
      subject: 'Welcome to Surakshya',
      text: `Welcome to Surakshya, ${fullName}! Your account has been created successfully.`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Welcome to Surakshya</h2>
          <p>Hello ${safeFullName},</p>
          <p>Your account has been created successfully.</p>
          <p>Thank you for joining Surakshya.</p>
        </div>
      `,
    });
  }

  private escapeHtml(value: string): string {
    return value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;',
        })[character] || '',
    );
  }
}
