import { Test, TestingModule } from '@nestjs/testing';
import { CaseStatus } from 'src/constants/cases.constants';
import { CasesPoliceController } from './cases-police.controller';
import { CasesService } from './cases.service';

describe('CasesPoliceController', () => {
  let controller: CasesPoliceController;
  let service: jest.Mocked<CasesService>;

  const mockService = {
    findForPolice: jest.fn(),
    findOneForPolice: jest.fn(),
    updateForPolice: jest.fn(),
  };

  const officerId = '550e8400-e29b-41d4-a716-446655440001';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CasesPoliceController],
      providers: [
        {
          provide: CasesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(CasesPoliceController);
    service = module.get(CasesService);
    jest.clearAllMocks();
  });

  it('lists station cases', async () => {
    const req = { user: { userId: officerId } } as never;
    service.findForPolice.mockResolvedValue({
      message: 'Cases retrieved successfully',
      cases: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await controller.findForStation(req, CaseStatus.OPEN, undefined, 1, 20);

    expect(service.findForPolice).toHaveBeenCalledWith(officerId, {
      status: CaseStatus.OPEN,
      priority: undefined,
      page: 1,
      limit: 20,
    });
  });

  it('gets a station case by id', async () => {
    const caseId = '550e8400-e29b-41d4-a716-446655440002';
    const req = { user: { userId: officerId } } as never;
    service.findOneForPolice.mockResolvedValue({
      message: 'Case retrieved successfully',
      case: { id: caseId },
    } as never);

    await controller.findOne(req, caseId);

    expect(service.findOneForPolice).toHaveBeenCalledWith(officerId, caseId);
  });

  it('updates a station case', async () => {
    const caseId = '550e8400-e29b-41d4-a716-446655440002';
    const req = { user: { userId: officerId } } as never;
    const dto = { summary: 'Updated summary' };
    service.updateForPolice.mockResolvedValue({
      message: 'Case updated successfully',
      case: { id: caseId, summary: 'Updated summary' },
    } as never);

    await controller.update(req, caseId, dto);

    expect(service.updateForPolice).toHaveBeenCalledWith(
      officerId,
      caseId,
      dto,
    );
  });
});
