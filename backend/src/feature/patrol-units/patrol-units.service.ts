import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { PoliceStation } from 'src/feature/police-stations/entities/police-station.entity';
import { User } from 'src/feature/user/entities/user.entity';
import { DispatchEventAction } from 'src/constants/dispatch.constants';
import { UnitStatus } from 'src/constants/patrol-units.constants';
import { DispatchService } from 'src/feature/dispatch/dispatch.service';
import { PatrolUnit } from './entities/patrol-unit.entity';
import { CreatePatrolUnitDto } from './dto/create-patrol-unit.dto';
import { UpdatePatrolUnitDto } from './dto/update-patrol-unit.dto';

export interface ListPatrolUnitsOptions {
  status?: UnitStatus;
  station_id?: string;
  province?: string;
  page: number;
  limit: number;
}

function formatPatrolUnit(unit: PatrolUnit) {
  return {
    id: unit.id,
    name: unit.name,
    vehicle: unit.vehicle,
    zone: unit.zone,
    province: unit.province,
    status: unit.status,
    station_id: unit.station_id ?? null,
    station: unit.station
      ? {
          id: unit.station.id,
          name: unit.station.name,
        }
      : null,
    lead_officer_id: unit.lead_officer_id ?? null,
    lead_officer: unit.lead_officer
      ? {
          id: unit.lead_officer.id,
          full_name: unit.lead_officer.full_name,
          email: unit.lead_officer.email,
          phone: unit.lead_officer.phone,
        }
      : null,
    contact_phone: unit.contact_phone ?? null,
    latitude: unit.latitude ?? null,
    longitude: unit.longitude ?? null,
    created_at: unit.created_at,
    updated_at: unit.updated_at,
  };
}

@Injectable()
export class PatrolUnitsService {
  constructor(
    @InjectRepository(PatrolUnit)
    private readonly unitRepo: Repository<PatrolUnit>,
    @InjectRepository(PoliceStation)
    private readonly stationRepo: Repository<PoliceStation>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dispatchService: DispatchService,
  ) {}

  async create(dto: CreatePatrolUnitDto) {
    await this.validateStationId(dto.station_id);
    await this.validateLeadOfficerId(dto.lead_officer_id);

    const unit = this.unitRepo.create({
      name: dto.name.trim(),
      vehicle: dto.vehicle.trim(),
      zone: dto.zone.trim(),
      province: dto.province.trim(),
      status: dto.status ?? UnitStatus.AVAILABLE,
      station_id: dto.station_id ?? null,
      lead_officer_id: dto.lead_officer_id ?? null,
      contact_phone: dto.contact_phone?.trim() ?? null,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
    });

    const saved = await this.unitRepo.save(unit);
    const hydrated = await this.findUnitOrThrow(saved.id);

    return {
      message: 'Patrol unit created successfully',
      unit: formatPatrolUnit(hydrated),
    };
  }

  async findAll(options: ListPatrolUnitsOptions) {
    const query = this.unitRepo
      .createQueryBuilder('unit')
      .leftJoinAndSelect('unit.station', 'station')
      .leftJoinAndSelect('unit.lead_officer', 'lead_officer');

    if (options.status) {
      query.andWhere('unit.status = :status', { status: options.status });
    }

    if (options.station_id) {
      query.andWhere('unit.station_id = :station_id', {
        station_id: options.station_id,
      });
    }

    if (options.province) {
      query.andWhere('unit.province ILIKE :province', {
        province: options.province,
      });
    }

    const skip = (options.page - 1) * options.limit;
    const [units, total] = await query
      .orderBy('unit.name', 'ASC')
      .skip(skip)
      .take(options.limit)
      .getManyAndCount();

    return {
      message: 'Patrol units retrieved successfully',
      units: units.map(formatPatrolUnit),
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async update(id: string, dto: UpdatePatrolUnitDto) {
    const unit = await this.findUnitOrThrow(id);
    const previousStatus = unit.status;

    if (dto.station_id !== undefined) {
      await this.validateStationId(dto.station_id);
      unit.station_id = dto.station_id ?? null;
    }

    if (dto.lead_officer_id !== undefined) {
      await this.validateLeadOfficerId(dto.lead_officer_id);
      unit.lead_officer_id = dto.lead_officer_id ?? null;
    }

    if (dto.name !== undefined) unit.name = dto.name.trim();
    if (dto.vehicle !== undefined) unit.vehicle = dto.vehicle.trim();
    if (dto.zone !== undefined) unit.zone = dto.zone.trim();
    if (dto.province !== undefined) unit.province = dto.province.trim();
    if (dto.status !== undefined) unit.status = dto.status;
    if (dto.contact_phone !== undefined) {
      unit.contact_phone = dto.contact_phone?.trim() ?? null;
    }
    if (dto.latitude !== undefined) unit.latitude = dto.latitude ?? null;
    if (dto.longitude !== undefined) unit.longitude = dto.longitude ?? null;

    await this.unitRepo.save(unit);
    const hydrated = await this.findUnitOrThrow(id);

    if (dto.status !== undefined && dto.status !== previousStatus) {
      let action: DispatchEventAction | null = null;
      if (dto.status === UnitStatus.DISPATCHED) {
        action = DispatchEventAction.DISPATCHED;
      } else if (dto.status === UnitStatus.ON_SCENE) {
        action = DispatchEventAction.ON_SCENE;
      }

      if (action) {
        await this.dispatchService.record({
          action,
          unit_id: hydrated.id,
          unit_name: hydrated.name,
          officer_id: hydrated.lead_officer_id ?? null,
          officer_name: hydrated.lead_officer?.full_name ?? null,
          metadata: {
            previous_status: previousStatus,
            status: dto.status,
          },
        });
      }
    }

    return {
      message: 'Patrol unit updated successfully',
      unit: formatPatrolUnit(hydrated),
    };
  }

  async findForPolice(
    officerUserId: string,
    options?: { status?: UnitStatus },
  ) {
    const officer = await this.userRepo.findOne({
      where: { id: officerUserId },
      select: ['id', 'role', 'station_id'],
    });

    if (!officer) {
      throw new NotFoundException('Officer not found');
    }

    if (officer.role !== Role.POLICE) {
      throw new ForbiddenException('Only police officers can access station units');
    }

    if (!officer.station_id) {
      throw new ForbiddenException('No police station assigned to this officer');
    }

    const query = this.unitRepo
      .createQueryBuilder('unit')
      .leftJoinAndSelect('unit.station', 'station')
      .leftJoinAndSelect('unit.lead_officer', 'lead_officer')
      .where('unit.station_id = :station_id', {
        station_id: officer.station_id,
      });

    if (options?.status) {
      query.andWhere('unit.status = :status', { status: options.status });
    }

    const units = await query.orderBy('unit.name', 'ASC').getMany();

    return {
      message: 'Patrol units retrieved successfully',
      units: units.map(formatPatrolUnit),
      total: units.length,
    };
  }

  private async findUnitOrThrow(id: string): Promise<PatrolUnit> {
    const unit = await this.unitRepo.findOne({
      where: { id },
      relations: ['station', 'lead_officer'],
    });

    if (!unit) {
      throw new NotFoundException('Patrol unit not found');
    }

    return unit;
  }

  private async validateStationId(stationId?: string | null) {
    if (!stationId) return;

    const station = await this.stationRepo.findOne({
      where: { id: stationId },
      select: ['id'],
    });

    if (!station) {
      throw new NotFoundException('Police station not found');
    }
  }

  private async validateLeadOfficerId(officerId?: string | null) {
    if (!officerId) return;

    const officer = await this.userRepo.findOne({
      where: { id: officerId },
      select: ['id', 'role'],
    });

    if (!officer) {
      throw new NotFoundException('Lead officer not found');
    }

    if (officer.role !== Role.POLICE) {
      throw new BadRequestException('Lead officer must have the POLICE role');
    }
  }
}
