import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { EmailService } from './email.service';
import { OtpEmailService } from './email/otp.email';
import { WelcomeEmailService } from './email/welcome.email';
import { SmsService } from './sms/sms.service';
import { NotificationFailure } from './entities/notification-failure.entity';
import { NotificationBootstrapService } from './notification-bootstrap.service';
import { VoiceCallService } from './voice/voice-call.service';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationFailure])],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationBootstrapService,
    EmailService,
    OtpEmailService,
    WelcomeEmailService,
    SmsService,
    VoiceCallService,
  ],
  exports: [
    NotificationService,
    OtpEmailService,
    WelcomeEmailService,
    SmsService,
    VoiceCallService,
    TypeOrmModule,
  ],
})
export class NotificationModule {}
