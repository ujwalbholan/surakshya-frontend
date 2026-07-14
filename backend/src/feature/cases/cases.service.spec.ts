import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CasePriority, CaseStatus } from 'src/constants/cases.constants';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { DispatchService } from 'src/feature/dispatch/dispatch.service';
import { PatrolUnit } from 'src/feature/patrol-units/entities/patrol-unit.entity';
import { PoliceStation } from 'src/feature/police-stations/entities/police-station.entity';
import { User } from 'src/feature/user/entities/user.entity';
import { CaseNote } from './entities/case-note.entity';
import { CaseStatusHistory } from './entities/case-status-history.entity';
import { Case } from './entities/case.entity';
import { CasesService } from './cases.service';

describe('CasesService', () => {
  let service: CasesService;
  let caseRepo: jest.Mocked<Repository<Case>>;
  let statusHistoryRepo: jest.Mocked<Repository<CaseStatusHistory>>;
  let noteRepo: jest.Mocked<Repository<CaseNote>>;
  let stationRepo: jest.Mocked<Repository<PoliceStation>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let unitRepo: jest.Mocked<Repository<PatrolUnit>>;
  let sosEventRepo: jest.Mocked<Repository<SosEvent>>;

  const stationId = '550e8400-e29b-41d4-a716-446655440000';
  const officerId = '550e8400-e29b-41d4-a716-446655440001';
  const caseId = '550e8400-e29b-41d4-a716-446655440002';

  const mockCase = (overrides: Partial<Case> = {}): Case => ({
    id: caseId,
    case_number: 'CASE-2026-0001',
    status: CaseStatus.OPEN,
    priority: CasePriority.HIGH,
    summary: 'Distress call near Durbar Marg',
    district: 'Kathmandu',
    province: 'Bagmati',
    victim_name: 'Sita Sharma',
    sos_event_id: null,
    station_id: stationId,
    station: {
      id: stationId,
      name: 'Kathmandu Metro Police',
      address: 'Durbar Marg',
      contact_number: '+9779801234567',
      created_at: new Date(),
      updated_at: new Date(),
    },
    assigned_officer_id: officerId,
    assigned_officer: {
      id: officerId,
      full_name: 'Insp. Bikash Thapa',
      email: 'bikash@test.com',
      phone: '9800000000',
      password_hash: 'hash',
      role: Role.POLICE,
      is_active: true,
      phone_verified: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
    assigned_unit_id: null,
    opened_at: new Date(),
    closed_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    status_history: [],
    notes: [],
    ...overrides,
  });

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getMany: jest.fn(),
    getOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasesService,
        {
          provide: getRepositoryToken(Case),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(CaseStatusHistory),
          useValue: {
            create: jest.fn((data) => data),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CaseNote),
          useValue: {
            create: jest.fn((data) => data),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PoliceStation),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(PatrolUnit),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(SosEvent),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: DispatchService,
          useValue: { record: jest.fn().mockResolvedValue({}) },
        },
      ],
    }).compile();

    service = module.get(CasesService);
    caseRepo = module.get(getRepositoryToken(Case));
    statusHistoryRepo = module.get(getRepositoryToken(CaseStatusHistory));
    noteRepo = module.get(getRepositoryToken(CaseNote));
    stationRepo = module.get(getRepositoryToken(PoliceStation));
    userRepo = module.get(getRepositoryToken(User));
    unitRepo = module.get(getRepositoryToken(PatrolUnit));
    sosEventRepo = module.get(getRepositoryToken(SosEvent));
    jest.clearAllMocks();
    mockQueryBuilder.leftJoinAndSelect.mockReturnThis();
    mockQueryBuilder.andWhere.mockReturnThis();
    mockQueryBuilder.where.mockReturnThis();
    mockQueryBuilder.orderBy.mockReturnThis();
    mockQueryBuilder.skip.mockReturnThis();
    mockQueryBuilder.take.mockReturnThis();
  });

  it('creates a case with initial status history', async () => {
    const dto = {
      summary: 'Distress call near Durbar Marg',
      station_id: stationId,
      assigned_officer_id: officerId,
      priority: CasePriority.HIGH,
    };

    stationRepo.findOne.mockResolvedValue({ id: stationId } as PoliceStation);
    userRepo.findOne.mockResolvedValue({
      id: officerId,
      role: Role.POLICE,
    } as User);
    mockQueryBuilder.getOne.mockResolvedValue(null);
    caseRepo.create.mockReturnValue(mockCase());
    caseRepo.save.mockResolvedValue(mockCase());
    caseRepo.findOne.mockResolvedValue(mockCase());

    const result = await service.create(dto, 'admin-id');

    expect(statusHistoryRepo.save).toHaveBeenCalled();
    expect(result.case.case_number).toMatch(/^CASE-\d{4}-\d{4}$/);
    expect(result.message).toContain('created');
  });

  it('rejects create when station is missing', async () => {
    stationRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        summary: 'Test case',
        station_id: stationId,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('lists cases with pagination', async () => {
    mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockCase()], 1]);

    const result = await service.findAll({
      status: CaseStatus.OPEN,
      page: 1,
      limit: 20,
    });

    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'case.status = :status',
      { status: CaseStatus.OPEN },
    );
    expect(result.cases).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('updates case status and records history', async () => {
    const existing = mockCase();
    caseRepo.findOne.mockResolvedValue(existing);
    caseRepo.save.mockResolvedValue({
      ...existing,
      status: CaseStatus.INVESTIGATING,
    });

    const result = await service.updateStatus(
      caseId,
      CaseStatus.INVESTIGATING,
      officerId,
    );

    expect(statusHistoryRepo.save).toHaveBeenCalled();
    expect(result.case.status).toBe(CaseStatus.INVESTIGATING);
  });

  it('rejects duplicate status update', async () => {
    caseRepo.findOne.mockResolvedValue(mockCase({ status: CaseStatus.OPEN }));

    await expect(
      service.updateStatus(caseId, CaseStatus.OPEN, officerId),
    ).rejects.toThrow(BadRequestException);
  });

  it('adds a note to a case', async () => {
    caseRepo.findOne.mockResolvedValue(mockCase());
    noteRepo.save.mockResolvedValue({
      id: 'note-id',
      case_id: caseId,
      body: 'Officer dispatched',
      author_id: officerId,
      created_at: new Date(),
    });
    noteRepo.findOne.mockResolvedValue({
      id: 'note-id',
      case_id: caseId,
      body: 'Officer dispatched',
      author_id: officerId,
      author: {
        id: officerId,
        full_name: 'Insp. Bikash Thapa',
        email: 'bikash@test.com',
        phone: '9800000000',
      } as User,
      created_at: new Date(),
    } as CaseNote);

    const result = await service.addNote(caseId, 'Officer dispatched', officerId);

    expect(result.note.body).toBe('Officer dispatched');
    expect(result.message).toContain('note');
  });

  it('returns station-scoped cases for police officers', async () => {
    userRepo.findOne.mockResolvedValue({
      id: officerId,
      role: Role.POLICE,
      station_id: stationId,
    } as User);
    mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockCase()], 1]);

    const result = await service.findForPolice(officerId);

    expect(mockQueryBuilder.where).toHaveBeenCalledWith(
      'case.station_id = :station_id',
      { station_id: stationId },
    );
    expect(result.cases).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('rejects police listing when officer has no station', async () => {
    userRepo.findOne.mockResolvedValue({
      id: officerId,
      role: Role.POLICE,
      station_id: null,
    } as User);

    await expect(service.findForPolice(officerId)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects police update for cases outside station', async () => {
    userRepo.findOne.mockResolvedValue({
      id: officerId,
      role: Role.POLICE,
      station_id: stationId,
    } as User);
    caseRepo.findOne.mockResolvedValue(
      mockCase({ station_id: 'other-station-id' }),
    );

    await expect(
      service.updateForPolice(officerId, caseId, {
        summary: 'Updated summary',
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
