import { Test, TestingModule } from '@nestjs/testing';
import { ReportRange } from 'src/constants/reports.constants';
import { ReportsPoliceController } from './reports-police.controller';
import { ReportsService } from './reports.service';

describe('ReportsPoliceController', () => {
  let controller: ReportsPoliceController;
  let service: jest.Mocked<ReportsService>;

  const mockService = {
    getSummaryForPolice: jest.fn(),
  };

  const officerUserId = '550e8400-e29b-41d4-a716-446655440001';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsPoliceController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(ReportsPoliceController);
    service = module.get(ReportsService);
    jest.clearAllMocks();
  });

  it('gets station-scoped summary for the officer', async () => {
    service.getSummaryForPolice.mockResolvedValue({
      message: 'Report summary retrieved successfully',
      range: ReportRange.SEVEN_DAYS,
      total_sos: 4,
      resolved_count: 3,
      avg_response_minutes: '5.1',
      resolution_rate: 75,
      active_cases: 1,
      units_dispatched: 1,
    });

    await controller.getSummary(
      { user: { userId: officerUserId } } as never,
      { range: ReportRange.SEVEN_DAYS },
    );

    expect(service.getSummaryForPolice).toHaveBeenCalledWith(
      officerUserId,
      ReportRange.SEVEN_DAYS,
    );
  });
});
