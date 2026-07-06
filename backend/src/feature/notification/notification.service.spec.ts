import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { SmsService } from './sms/sms.service';
import { EmailService } from './email.service';
import { NotificationFailure } from './entities/notification-failure.entity';

describe('NotificationService', () => {
  let service: NotificationService;
  let smsService: { send: jest.Mock };
  let emailService: { send: jest.Mock };
  let failureRepo: { save: jest.Mock };

  beforeEach(async () => {
    smsService = { send: jest.fn() };
    emailService = { send: jest.fn() };
    failureRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: SmsService,
          useValue: smsService,
        },
        {
          provide: EmailService,
          useValue: emailService,
        },
        {
          provide: getRepositoryToken(NotificationFailure),
          useValue: failureRepo,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send SMS', async () => {
    const result = await service.sendSms({
      to: '+9779800000000',
      message: 'Hello',
    });
    expect(result.message).toBe('SMS sent successfully');
  });

  it('should send email', async () => {
    const result = await service.sendEmail({
      to: 'test@test.com',
      subject: 'Test',
      text: 'Test',
      html: '<p>Test</p>',
    });
    expect(result.message).toBe('Email sent successfully');
  });

  it('logs NOTIFICATION_CRITICAL_FAILURE when an SOS-tied SMS fails', async () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    smsService.send.mockRejectedValue(new Error('Twilio down'));

    await expect(
      service.sendSms({
        to: '+9779800000000',
        message: 'SOS alert',
        context: { sosEventId: 'sos-event-123' },
      }),
    ).rejects.toThrow('Twilio down');

    expect(failureRepo.save).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      JSON.stringify({
        tag: 'NOTIFICATION_CRITICAL_FAILURE',
        level: 'error',
        type: 'sms',
        recipient: '+9779800000000',
        sosEventId: 'sos-event-123',
        error: 'Twilio down',
      }),
    );
  });
});
