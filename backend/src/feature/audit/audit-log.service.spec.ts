import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction, AuditResult } from 'src/constants/audit.constants';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { User } from 'src/feature/user/entities/user.entity';
import { AuditLogService } from './audit-log.service';
import { AuditLog } from './entities/audit-log.entity';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let auditLogRepo: jest.Mocked<Repository<AuditLog>>;

  const actorId = '550e8400-e29b-41d4-a716-446655440001';
  const logId = '550e8400-e29b-41d4-a716-446655440002';

  const mockAuditLog = (overrides: Partial<AuditLog> = {}): AuditLog =>
    ({
      id: logId,
      actor_user_id: actorId,
      actor: {
        id: actorId,
        full_name: 'Ujwal Bholan',
        email: 'ujwalbholan@gmail.com',
        phone: '9800000000',
        role: Role.ADMIN,
      } as User,
      actor_role: Role.ADMIN,
      action: AuditAction.LOGIN,
      target_entity_type: null,
      target_entity_id: null,
      target_label: null,
      ip_address: '192.168.1.1',
      result: AuditResult.SUCCESS,
      metadata: null,
      created_at: new Date('2026-03-09T07:41:22.000Z'),
      ...overrides,
    }) as AuditLog;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get(AuditLogService);
    auditLogRepo = module.get(getRepositoryToken(AuditLog));
    jest.clearAllMocks();
  });

  it('records an audit log entry', async () => {
    const input = {
      actor_user_id: actorId,
      actor_role: Role.ADMIN,
      action: AuditAction.CREATE_USER,
      target_entity_type: 'user',
      target_entity_id: '550e8400-e29b-41d4-a716-446655440003',
      target_label: 'maya@gmail.com',
      ip_address: '192.168.1.1',
      result: AuditResult.SUCCESS,
    };
    const created = mockAuditLog(input);
    auditLogRepo.create.mockReturnValue(created);
    auditLogRepo.save.mockResolvedValue(created);

    const result = await service.record(input);

    expect(auditLogRepo.create).toHaveBeenCalledWith({
      actor_user_id: actorId,
      actor_role: Role.ADMIN,
      action: AuditAction.CREATE_USER,
      target_entity_type: 'user',
      target_entity_id: '550e8400-e29b-41d4-a716-446655440003',
      target_label: 'maya@gmail.com',
      ip_address: '192.168.1.1',
      result: AuditResult.SUCCESS,
      metadata: null,
    });
    expect(result).toBe(created);
  });

  it('lists audit logs with pagination', async () => {
    const log = mockAuditLog();
    mockQueryBuilder.getManyAndCount.mockResolvedValue([[log], 1]);

    const result = await service.findAll({
      action: AuditAction.LOGIN,
      actor_user_id: actorId,
      page: 1,
      limit: 20,
    });

    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'audit_log.action = :action',
      { action: AuditAction.LOGIN },
    );
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'audit_log.actor_user_id = :actor_user_id',
      { actor_user_id: actorId },
    );
    expect(result.audit_logs).toHaveLength(1);
    expect(result.audit_logs[0].result_label).toBe('Success');
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('gets an audit log by id', async () => {
    const log = mockAuditLog();
    auditLogRepo.findOne.mockResolvedValue(log);

    const result = await service.findOne(logId);

    expect(auditLogRepo.findOne).toHaveBeenCalledWith({
      where: { id: logId },
      relations: ['actor'],
    });
    expect(result.audit_log.id).toBe(logId);
    expect(result.audit_log.result_label).toBe('Success');
  });

  it('throws when audit log is not found', async () => {
    auditLogRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne(logId)).rejects.toThrow(NotFoundException);
  });
});
