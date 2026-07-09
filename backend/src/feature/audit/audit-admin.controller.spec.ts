import { Test, TestingModule } from '@nestjs/testing';
import { AuditAction } from 'src/constants/audit.constants';
import { AuditAdminController } from './audit-admin.controller';
import { AuditLogService } from './audit-log.service';

describe('AuditAdminController', () => {
  let controller: AuditAdminController;
  let service: jest.Mocked<AuditLogService>;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditAdminController],
      providers: [
        {
          provide: AuditLogService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(AuditAdminController);
    service = module.get(AuditLogService);
    jest.clearAllMocks();
  });

  it('lists audit logs with filters', async () => {
    const actorUserId = '550e8400-e29b-41d4-a716-446655440001';
    const from = '2026-03-01T00:00:00.000Z';
    const to = '2026-03-31T23:59:59.999Z';
    service.findAll.mockResolvedValue({
      message: 'Audit logs retrieved successfully',
      audit_logs: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await controller.findAll(
      AuditAction.LOGIN,
      actorUserId,
      from,
      to,
      1,
      20,
    );

    expect(service.findAll).toHaveBeenCalledWith({
      action: AuditAction.LOGIN,
      actor_user_id: actorUserId,
      from: new Date(from),
      to: new Date(to),
      page: 1,
      limit: 20,
    });
  });

  it('gets an audit log by id', async () => {
    const logId = '550e8400-e29b-41d4-a716-446655440002';
    service.findOne.mockResolvedValue({
      message: 'Audit log retrieved successfully',
      audit_log: { id: logId },
    } as never);

    await controller.findOne(logId);

    expect(service.findOne).toHaveBeenCalledWith(logId);
  });
});
