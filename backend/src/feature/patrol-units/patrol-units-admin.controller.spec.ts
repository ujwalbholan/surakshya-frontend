import { Test, TestingModule } from '@nestjs/testing';
import { UnitStatus } from 'src/constants/patrol-units.constants';
import { PatrolUnitsAdminController } from './patrol-units-admin.controller';
import { PatrolUnitsService } from './patrol-units.service';

describe('PatrolUnitsAdminController', () => {
  let controller: PatrolUnitsAdminController;
  let service: jest.Mocked<PatrolUnitsService>;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatrolUnitsAdminController],
      providers: [
        {
          provide: PatrolUnitsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(PatrolUnitsAdminController);
    service = module.get(PatrolUnitsService);
    jest.clearAllMocks();
  });

  it('creates a patrol unit', async () => {
    const dto = {
      name: 'Unit 12 — Metro',
      vehicle: 'NP-01-001-2345',
      zone: 'Kathmandu Metro',
      province: 'Bagmati',
    };
    service.create.mockResolvedValue({
      message: 'Patrol unit created successfully',
      unit: { id: 'unit-id', ...dto, status: UnitStatus.AVAILABLE },
    } as never);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result.unit.name).toBe(dto.name);
  });

  it('lists patrol units with filters', async () => {
    service.findAll.mockResolvedValue({
      message: 'Patrol units retrieved successfully',
      units: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await controller.findAll(
      UnitStatus.AVAILABLE,
      '550e8400-e29b-41d4-a716-446655440000',
      'Bagmati',
      1,
      20,
    );

    expect(service.findAll).toHaveBeenCalledWith({
      status: UnitStatus.AVAILABLE,
      station_id: '550e8400-e29b-41d4-a716-446655440000',
      province: 'Bagmati',
      page: 1,
      limit: 20,
    });
  });

  it('updates a patrol unit', async () => {
    const unitId = '550e8400-e29b-41d4-a716-446655440002';
    const dto = { status: UnitStatus.DISPATCHED };
    service.update.mockResolvedValue({
      message: 'Patrol unit updated successfully',
      unit: { id: unitId, status: UnitStatus.DISPATCHED },
    } as never);

    await controller.update(unitId, dto);

    expect(service.update).toHaveBeenCalledWith(unitId, dto);
  });
});
