import { Test, TestingModule } from '@nestjs/testing';
import { EvidenceFileType } from 'src/constants/evidence.constants';
import { EvidenceAdminController } from './evidence-admin.controller';
import { EvidenceService } from './evidence.service';

describe('EvidenceAdminController', () => {
  let controller: EvidenceAdminController;
  let service: jest.Mocked<EvidenceService>;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvidenceAdminController],
      providers: [
        {
          provide: EvidenceService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(EvidenceAdminController);
    service = module.get(EvidenceService);
    jest.clearAllMocks();
  });

  it('creates an evidence record', async () => {
    const dto = {
      case_id: '550e8400-e29b-41d4-a716-446655440002',
      file_name: 'recording_2026-03-09.aes',
      storage_key: 'evidence/recording_2026-03-09.aes',
      file_type: EvidenceFileType.AUDIO,
      size_bytes: 245760,
      checksum: 'a3b5c7d9e1f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2',
    };
    const req = { user: { userId: 'admin-id' } } as never;
    service.create.mockResolvedValue({
      message: 'Evidence record created successfully',
      evidence: { id: 'evidence-id', ...dto },
    } as never);

    const result = await controller.create(req, dto);

    expect(service.create).toHaveBeenCalledWith(dto, 'admin-id');
    expect(result.evidence.file_name).toBe(dto.file_name);
  });

  it('lists evidence with filters', async () => {
    const caseId = '550e8400-e29b-41d4-a716-446655440002';
    service.findAll.mockResolvedValue({
      message: 'Evidence records retrieved successfully',
      evidence: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await controller.findAll(caseId, EvidenceFileType.AUDIO, 1, 20);

    expect(service.findAll).toHaveBeenCalledWith({
      case_id: caseId,
      file_type: EvidenceFileType.AUDIO,
      page: 1,
      limit: 20,
    });
  });

  it('gets evidence by id', async () => {
    const evidenceId = '550e8400-e29b-41d4-a716-446655440003';
    service.findOne.mockResolvedValue({
      message: 'Evidence record retrieved successfully',
      evidence: { id: evidenceId },
    } as never);

    await controller.findOne(evidenceId);

    expect(service.findOne).toHaveBeenCalledWith(evidenceId);
  });
});
