import { Test, TestingModule } from '@nestjs/testing';
import { EvidenceFileType } from 'src/constants/evidence.constants';
import { EvidencePoliceController } from './evidence-police.controller';
import { EvidenceService } from './evidence.service';

describe('EvidencePoliceController', () => {
  let controller: EvidencePoliceController;
  let service: jest.Mocked<EvidenceService>;

  const mockService = {
    findForPolice: jest.fn(),
    findOneForPolice: jest.fn(),
  };

  const officerId = '550e8400-e29b-41d4-a716-446655440001';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvidencePoliceController],
      providers: [
        {
          provide: EvidenceService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(EvidencePoliceController);
    service = module.get(EvidenceService);
    jest.clearAllMocks();
  });

  it('lists station evidence', async () => {
    const req = { user: { userId: officerId } } as never;
    const caseId = '550e8400-e29b-41d4-a716-446655440002';
    service.findForPolice.mockResolvedValue({
      message: 'Evidence records retrieved successfully',
      evidence: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await controller.findForStation(
      req,
      caseId,
      EvidenceFileType.GPS,
      1,
      20,
    );

    expect(service.findForPolice).toHaveBeenCalledWith(officerId, {
      case_id: caseId,
      file_type: EvidenceFileType.GPS,
      page: 1,
      limit: 20,
    });
  });

  it('gets station evidence by id', async () => {
    const evidenceId = '550e8400-e29b-41d4-a716-446655440003';
    const req = { user: { userId: officerId } } as never;
    service.findOneForPolice.mockResolvedValue({
      message: 'Evidence record retrieved successfully',
      evidence: { id: evidenceId },
    } as never);

    await controller.findOne(req, evidenceId);

    expect(service.findOneForPolice).toHaveBeenCalledWith(
      officerId,
      evidenceId,
    );
  });
});
