import { Test, TestingModule } from '@nestjs/testing';
import { PatrolUnitsPoliceController } from './patrol-units-police.controller';
import { PatrolUnitsService } from './patrol-units.service';

describe('PatrolUnitsPoliceController', () => {
  let controller: PatrolUnitsPoliceController;
  let service: jest.Mocked<PatrolUnitsService>;

  const mockService = {
    findForPolice: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatrolUnitsPoliceController],
      providers: [
        {
          provide: PatrolUnitsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(PatrolUnitsPoliceController);
    service = module.get(PatrolUnitsService);
    jest.clearAllMocks();
  });

  it('lists station-scoped units for the authenticated officer', async () => {
    const req = { user: { userId: 'officer-id' } } as never;
    service.findForPolice.mockResolvedValue({
      message: 'Patrol units retrieved successfully',
      units: [],
      total: 0,
    });

    await controller.findForStation(req);

    expect(service.findForPolice).toHaveBeenCalledWith('officer-id', {
      status: undefined,
    });
  });
});
