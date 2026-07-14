import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { PoliceStation } from 'src/feature/police-stations/entities/police-station.entity';
import { User } from 'src/feature/user/entities/user.entity';
import { DispatchService } from 'src/feature/dispatch/dispatch.service';
import { UnitStatus } from 'src/constants/patrol-units.constants';
import { PatrolUnit } from './entities/patrol-unit.entity';
import { PatrolUnitsService } from './patrol-units.service';

describe('PatrolUnitsService', () => {
  let service: PatrolUnitsService;
  let unitRepo: jest.Mocked<Repository<PatrolUnit>>;
  let stationRepo: jest.Mocked<Repository<PoliceStation>>;
  let userRepo: jest.Mocked<Repository<User>>;

  const stationId = '550e8400-e29b-41d4-a716-446655440000';
  const officerId = '550e8400-e29b-41d4-a716-446655440001';
  const unitId = '550e8400-e29b-41d4-a716-446655440002';

  const mockUnit = (overrides: Partial<PatrolUnit> = {}): PatrolUnit => ({
    id: unitId,
    name: 'Unit 12 — Metro',
    vehicle: 'NP-01-001-2345',
    zone: 'Kathmandu Metro',
    province: 'Bagmati',
    status: UnitStatus.AVAILABLE,
    station_id: stationId,
    station: {
      id: stationId,
      name: 'Kathmandu Metro Police',
      address: 'Durbar Marg',
      contact_number: '+9779801234567',
      created_at: new Date(),
      updated_at: new Date(),
    },
    lead_officer_id: officerId,
    lead_officer: {
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
    contact_phone: '+9779801234567',
    latitude: null,
    longitude: null,
    created_at: new Date(),
    updated_at: new Date(),
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatrolUnitsService,
        {
          provide: getRepositoryToken(PatrolUnit),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(PoliceStation),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DispatchService,
          useValue: { record: jest.fn().mockResolvedValue({}) },
        },
      ],
    }).compile();

    service = module.get(PatrolUnitsService);
    unitRepo = module.get(getRepositoryToken(PatrolUnit));
    stationRepo = module.get(getRepositoryToken(PoliceStation));
    userRepo = module.get(getRepositoryToken(User));
    jest.clearAllMocks();
    mockQueryBuilder.leftJoinAndSelect.mockReturnThis();
    mockQueryBuilder.andWhere.mockReturnThis();
    mockQueryBuilder.where.mockReturnThis();
    mockQueryBuilder.orderBy.mockReturnThis();
    mockQueryBuilder.skip.mockReturnThis();
    mockQueryBuilder.take.mockReturnThis();
  });

  it('creates a patrol unit', async () => {
    const dto = {
      name: 'Unit 12 — Metro',
      vehicle: 'NP-01-001-2345',
      zone: 'Kathmandu Metro',
      province: 'Bagmati',
      station_id: stationId,
      lead_officer_id: officerId,
    };

    stationRepo.findOne.mockResolvedValue({ id: stationId } as PoliceStation);
    userRepo.findOne.mockResolvedValue({
      id: officerId,
      role: Role.POLICE,
    } as User);
    unitRepo.create.mockReturnValue(mockUnit());
    unitRepo.save.mockResolvedValue(mockUnit());
    unitRepo.findOne.mockResolvedValue(mockUnit());

    const result = await service.create(dto);

    expect(stationRepo.findOne).toHaveBeenCalledWith({
      where: { id: stationId },
      select: ['id'],
    });
    expect(result.unit.name).toBe('Unit 12 — Metro');
    expect(result.message).toContain('created');
  });

  it('rejects create when station is missing', async () => {
    stationRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        name: 'Unit 1',
        vehicle: 'NP-01',
        zone: 'Zone',
        province: 'Bagmati',
        station_id: stationId,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects create when lead officer is not police', async () => {
    userRepo.findOne.mockResolvedValue({
      id: officerId,
      role: Role.USER,
    } as User);

    await expect(
      service.create({
        name: 'Unit 1',
        vehicle: 'NP-01',
        zone: 'Zone',
        province: 'Bagmati',
        lead_officer_id: officerId,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('lists patrol units with pagination', async () => {
    mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockUnit()], 1]);

    const result = await service.findAll({
      status: UnitStatus.AVAILABLE,
      page: 1,
      limit: 20,
    });

    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'unit.status = :status',
      { status: UnitStatus.AVAILABLE },
    );
    expect(result.units).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('updates a patrol unit', async () => {
    const existing = mockUnit();
    unitRepo.findOne.mockResolvedValue(existing);
    unitRepo.save.mockResolvedValue({
      ...existing,
      status: UnitStatus.DISPATCHED,
    });

    const result = await service.update(unitId, {
      status: UnitStatus.DISPATCHED,
    });

    expect(unitRepo.save).toHaveBeenCalled();
    expect(result.unit.status).toBe(UnitStatus.DISPATCHED);
  });

  it('throws when updating a missing unit', async () => {
    unitRepo.findOne.mockResolvedValue(null);

    await expect(
      service.update(unitId, { status: UnitStatus.OFFLINE }),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns station-scoped units for police officers', async () => {
    userRepo.findOne.mockResolvedValue({
      id: officerId,
      role: Role.POLICE,
      station_id: stationId,
    } as User);
    mockQueryBuilder.getMany.mockResolvedValue([mockUnit()]);

    const result = await service.findForPolice(officerId);

    expect(mockQueryBuilder.where).toHaveBeenCalledWith(
      'unit.station_id = :station_id',
      { station_id: stationId },
    );
    expect(result.units).toHaveLength(1);
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
});
