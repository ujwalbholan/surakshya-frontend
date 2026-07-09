import { Test, TestingModule } from '@nestjs/testing';
import { ReportRange } from 'src/constants/reports.constants';
import { ReportsAdminController } from './reports-admin.controller';
import { ReportsService } from './reports.service';

describe('ReportsAdminController', () => {
  let controller: ReportsAdminController;
  let service: jest.Mocked<ReportsService>;

  const mockService = {
    getSummary: jest.fn(),
    getDailySeries: jest.fn(),
    getProvinceBreakdown: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsAdminController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(ReportsAdminController);
    service = module.get(ReportsService);
    jest.clearAllMocks();
  });

  it('gets summary with range', async () => {
    service.getSummary.mockResolvedValue({
      message: 'Report summary retrieved successfully',
      range: ReportRange.SEVEN_DAYS,
      total_sos: 10,
      resolved_count: 8,
      avg_response_minutes: '4.2',
      resolution_rate: 80,
      active_cases: 3,
      units_dispatched: 2,
    });

    await controller.getSummary({ range: ReportRange.SEVEN_DAYS });

    expect(service.getSummary).toHaveBeenCalledWith(ReportRange.SEVEN_DAYS);
  });

  it('defaults summary range to 30 days', async () => {
    service.getSummary.mockResolvedValue({} as never);

    await controller.getSummary({});

    expect(service.getSummary).toHaveBeenCalledWith(ReportRange.THIRTY_DAYS);
  });

  it('gets daily series', async () => {
    service.getDailySeries.mockResolvedValue({
      message: 'Daily report series retrieved successfully',
      range: ReportRange.THIRTY_DAYS,
      series: [],
    });

    await controller.getDailySeries({ range: ReportRange.THIRTY_DAYS });

    expect(service.getDailySeries).toHaveBeenCalledWith(ReportRange.THIRTY_DAYS);
  });

  it('gets province breakdown', async () => {
    service.getProvinceBreakdown.mockResolvedValue({
      message: 'Province breakdown retrieved successfully',
      range: ReportRange.NINETY_DAYS,
      provinces: [],
    });

    await controller.getProvinceBreakdown({ range: ReportRange.NINETY_DAYS });

    expect(service.getProvinceBreakdown).toHaveBeenCalledWith(
      ReportRange.NINETY_DAYS,
    );
  });
});
