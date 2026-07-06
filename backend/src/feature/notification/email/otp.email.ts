import { Injectable } from '@nestjs/common';
import { EmailService } from '../email.service';

@Injectable()
export class OtpEmailService {
  constructor(private readonly emailService: EmailService) {}

  async sendPasswordResetOtp(email: string, otp: string): Promise<void> {
    await this.emailService.send({
      to: email,
      subject: 'Password Reset OTP',
      text: `Your password reset OTP is ${otp}. It expires in 2 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Password Reset Request</h2>
          <p>Your OTP code is:</p>
          <h1 style="letter-spacing: 5px;">${otp}</h1>
          <p>This OTP will expire in 2 minutes.</p>
          <p>If you did not request this, ignore this email.</p>
        </div>
      `,
    });
  }
}
