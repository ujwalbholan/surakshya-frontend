import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvidenceFileType } from 'src/constants/evidence.constants';
import { CasePriority, CaseStatus } from 'src/constants/cases.constants';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { Case } from 'src/feature/cases/entities/case.entity';
import { User } from 'src/feature/user/entities/user.entity';
import { Evidence } from './entities/evidence.entity';
import { EvidenceService } from './evidence.service';

describe('EvidenceService', () => {
  let service: EvidenceService;
  let evidenceRepo: jest.Mocked<Repository<Evidence>>;
  let caseRepo: jest.Mocked<Repository<Case>>;
  let userRepo: jest.Mocked<Repository<User>>;

  const stationId = '550e8400-e29b-41d4-a716-446655440000';
  const officerId = '550e8400-e29b-41d4-a716-446655440001';
  const caseId = '550e8400-e29b-41d4-a716-446655440002';
  const evidenceId = '550e8400-e29b-41d4-a716-446655440003';

  const mockCase = (overrides: Partial<Case> = {}): Case =>
    ({
      id: caseId,
      case_number: 'CASE-2026-0001',
      status: CaseStatus.OPEN,
      priority: CasePriority.HIGH,
      summary: 'Distress call near Durbar Marg',
      district: 'Kathmandu',
      province: 'Bagmati',
      victim_name: 'Sita Sharma',
      station_id: stationId,
      opened_at: new Date(),
      closed_at: null,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    }) as Case;

  const mockEvidence = (overrides: Partial<Evidence> = {}): Evidence =>
    ({
      id: evidenceId,
      case_id: caseId,
      case: mockCase(),
      file_name: 'recording_2026-03-09.aes',
      storage_key: `evidence/${caseId}/recording_2026-03-09.aes`,
      mime_type: 'audio/aes',
      file_type: EvidenceFileType.AUDIO,
      size_bytes: '245760',
      checksum: 'a3b5c7d9e1f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2',
      uploaded_by_id: officerId,
      uploaded_by: {
        id: officerId,
        full_name: 'Insp. Bikash Thapa',
        email: 'bikash@test.com',
        phone: '9800000000',
      } as User,
      captured_at: new Date(),
      created_at: new Date(),
      ...overrides,
    }) as Evidence;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvidenceService,
        {
          provide: getRepositoryToken(Evidence),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Case),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(EvidenceService);
    evidenceRepo = module.get(getRepositoryToken(Evidence));
    caseRepo = module.get(getRepositoryToken(Case));
    userRepo = module.get(getRepositoryToken(User));
    jest.clearAllMocks();
    mockQueryBuilder.leftJoinAndSelect.mockReturnThis();
    mockQueryBuilder.andWhere.mockReturnThis();
    mockQueryBuilder.where.mockReturnThis();
    mockQueryBuilder.orderBy.mockReturnThis();
    mockQueryBuilder.skip.mockReturnThis();
    mockQueryBuilder.take.mockReturnThis();
  });

  it('creates an evidence record', async () => {
    const dto = {
      case_id: caseId,
      file_name: 'recording_2026-03-09.aes',
      storage_key: `evidence/${caseId}/recording_2026-03-09.aes`,
      mime_type: 'audio/aes',
      file_type: EvidenceFileType.AUDIO,
      size_bytes: 245760,
      checksum: 'a3b5c7d9e1f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2',
    };

    caseRepo.findOne.mockResolvedValue({ id: caseId } as Case);
    userRepo.findOne.mockResolvedValue({ id: officerId } as User);
    evidenceRepo.create.mockReturnValue(mockEvidence());
    evidenceRepo.save.mockResolvedValue(mockEvidence());
    evidenceRepo.findOne.mockResolvedValue(mockEvidence());

    const result = await service.create(dto, officerId);

    expect(result.evidence.file_name).toBe(dto.file_name);
    expect(result.evidence.case_id).toBe(caseId);
    expect(result.message).toContain('created');
  });

  it('rejects create when case is missing', async () => {
    caseRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create(
        {
          case_id: caseId,
          file_name: 'recording.aes',
          storage_key: 'evidence/recording.aes',
          file_type: EvidenceFileType.AUDIO,
          size_bytes: 1024,
          checksum: 'abc123',
        },
        officerId,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('lists evidence with pagination and filters', async () => {
    mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockEvidence()], 1]);

    const result = await service.findAll({
      case_id: caseId,
      file_type: EvidenceFileType.AUDIO,
      page: 1,
      limit: 20,
    });

    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'evidence.case_id = :case_id',
      { case_id: caseId },
    );
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'evidence.file_type = :file_type',
      { file_type: EvidenceFileType.AUDIO },
    );
    expect(result.evidence).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('returns station-scoped evidence for police officers', async () => {
    userRepo.findOne.mockResolvedValue({
      id: officerId,
      role: Role.POLICE,
      station_id: stationId,
    } as User);
    mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockEvidence()], 1]);

    const result = await service.findForPolice(officerId, {
      case_id: caseId,
    });

    expect(mockQueryBuilder.where).toHaveBeenCalledWith(
      'case.station_id = :station_id',
      { station_id: stationId },
    );
    expect(result.evidence).toHaveLength(1);
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

  it('rejects police detail for evidence outside station', async () => {
    userRepo.findOne.mockResolvedValue({
      id: officerId,
      role: Role.POLICE,
      station_id: stationId,
    } as User);
    evidenceRepo.findOne.mockResolvedValue(
      mockEvidence({
        case: mockCase({ station_id: 'other-station-id' }),
      }),
    );

    await expect(
      service.findOneForPolice(officerId, evidenceId),
    ).rejects.toThrow(ForbiddenException);
  });
});
