import { Test, TestingModule } from '@nestjs/testing';
import { CasePriority, CaseStatus } from 'src/constants/cases.constants';
import { CasesAdminController } from './cases-admin.controller';
import { CasesService } from './cases.service';

describe('CasesAdminController', () => {
  let controller: CasesAdminController;
  let service: jest.Mocked<CasesService>;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    addNote: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CasesAdminController],
      providers: [
        {
          provide: CasesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(CasesAdminController);
    service = module.get(CasesService);
    jest.clearAllMocks();
  });

  it('creates a case', async () => {
    const dto = {
      summary: 'Distress call near Durbar Marg',
      priority: CasePriority.HIGH,
    };
    const req = { user: { userId: 'admin-id' } } as never;
    service.create.mockResolvedValue({
      message: 'Case created successfully',
      case: { id: 'case-id', ...dto, status: CaseStatus.OPEN },
    } as never);

    const result = await controller.create(req, dto);

    expect(service.create).toHaveBeenCalledWith(dto, 'admin-id');
    expect(result.case.summary).toBe(dto.summary);
  });

  it('lists cases with filters', async () => {
    service.findAll.mockResolvedValue({
      message: 'Cases retrieved successfully',
      cases: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await controller.findAll(
      CaseStatus.OPEN,
      CasePriority.HIGH,
      '550e8400-e29b-41d4-a716-446655440000',
      'Bagmati',
      1,
      20,
    );

    expect(service.findAll).toHaveBeenCalledWith({
      status: CaseStatus.OPEN,
      priority: CasePriority.HIGH,
      station_id: '550e8400-e29b-41d4-a716-446655440000',
      province: 'Bagmati',
      page: 1,
      limit: 20,
    });
  });

  it('updates a case', async () => {
    const caseId = '550e8400-e29b-41d4-a716-446655440002';
    const dto = { status: CaseStatus.INVESTIGATING };
    const req = { user: { userId: 'admin-id' } } as never;
    service.update.mockResolvedValue({
      message: 'Case updated successfully',
      case: { id: caseId, status: CaseStatus.INVESTIGATING },
    } as never);

    await controller.update(req, caseId, dto);

    expect(service.update).toHaveBeenCalledWith(caseId, dto, 'admin-id');
  });

  it('updates case status', async () => {
    const caseId = '550e8400-e29b-41d4-a716-446655440002';
    const req = { user: { userId: 'admin-id' } } as never;
    service.updateStatus.mockResolvedValue({
      message: 'Case status updated successfully',
      case: { id: caseId, status: CaseStatus.CLOSED },
    } as never);

    await controller.updateStatus(req, caseId, { status: CaseStatus.CLOSED });

    expect(service.updateStatus).toHaveBeenCalledWith(
      caseId,
      CaseStatus.CLOSED,
      'admin-id',
    );
  });

  it('adds a case note', async () => {
    const caseId = '550e8400-e29b-41d4-a716-446655440002';
    const req = { user: { userId: 'admin-id' } } as never;
    service.addNote.mockResolvedValue({
      message: 'Case note added successfully',
      note: { id: 'note-id', body: 'Follow-up required' },
    } as never);

    await controller.addNote(req, caseId, { body: 'Follow-up required' });

    expect(service.addNote).toHaveBeenCalledWith(
      caseId,
      'Follow-up required',
      'admin-id',
    );
  });
});
