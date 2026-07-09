import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CasePriority, CaseStatus } from 'src/constants/cases.constants';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { PatrolUnit } from 'src/feature/patrol-units/entities/patrol-unit.entity';
import { PoliceStation } from 'src/feature/police-stations/entities/police-station.entity';
import { User } from 'src/feature/user/entities/user.entity';
import { CaseNote } from './entities/case-note.entity';
import { CaseStatusHistory } from './entities/case-status-history.entity';
import { Case } from './entities/case.entity';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';

export interface ListCasesOptions {
  status?: CaseStatus;
  priority?: CasePriority;
  station_id?: string;
  province?: string;
  page: number;
  limit: number;
}

function formatUserSummary(user: User | null | undefined) {
  if (!user) return null;
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
  };
}

function formatStationSummary(station: PoliceStation | null | undefined) {
  if (!station) return null;
  return {
    id: station.id,
    name: station.name,
  };
}

function formatUnitSummary(unit: PatrolUnit | null | undefined) {
  if (!unit) return null;
  return {
    id: unit.id,
    name: unit.name,
    vehicle: unit.vehicle,
    zone: unit.zone,
  };
}

function formatStatusHistory(entry: CaseStatusHistory) {
  return {
    id: entry.id,
    status: entry.status,
    changed_by_id: entry.changed_by_id ?? null,
    changed_by: formatUserSummary(entry.changed_by),
    created_at: entry.created_at,
  };
}

function formatNote(note: CaseNote) {
  return {
    id: note.id,
    body: note.body,
    author_id: note.author_id ?? null,
    author: formatUserSummary(note.author),
    created_at: note.created_at,
  };
}

function formatCase(caseEntity: Case, includeDetails = false) {
  const base = {
    id: caseEntity.id,
    case_number: caseEntity.case_number,
    status: caseEntity.status,
    priority: caseEntity.priority,
    summary: caseEntity.summary,
    district: caseEntity.district ?? null,
    province: caseEntity.province ?? null,
    victim_name: caseEntity.victim_name ?? null,
    sos_event_id: caseEntity.sos_event_id ?? null,
    station_id: caseEntity.station_id ?? null,
    station: formatStationSummary(caseEntity.station),
    assigned_officer_id: caseEntity.assigned_officer_id ?? null,
    assigned_officer: formatUserSummary(caseEntity.assigned_officer),
    assigned_unit_id: caseEntity.assigned_unit_id ?? null,
    assigned_unit: formatUnitSummary(caseEntity.assigned_unit),
    opened_at: caseEntity.opened_at,
    closed_at: caseEntity.closed_at ?? null,
    created_at: caseEntity.created_at,
    updated_at: caseEntity.updated_at,
  };

  if (!includeDetails) {
    return base;
  }

  return {
    ...base,
    status_history: (caseEntity.status_history ?? []).map(formatStatusHistory),
    notes: (caseEntity.notes ?? []).map(formatNote),
  };
}

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(Case)
    private readonly caseRepo: Repository<Case>,
    @InjectRepository(CaseStatusHistory)
    private readonly statusHistoryRepo: Repository<CaseStatusHistory>,
    @InjectRepository(CaseNote)
    private readonly noteRepo: Repository<CaseNote>,
    @InjectRepository(PoliceStation)
    private readonly stationRepo: Repository<PoliceStation>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(PatrolUnit)
    private readonly unitRepo: Repository<PatrolUnit>,
    @InjectRepository(SosEvent)
    private readonly sosEventRepo: Repository<SosEvent>,
  ) {}

  async create(dto: CreateCaseDto, actorUserId?: string) {
    await this.validateSosEventId(dto.sos_event_id);
    await this.validateStationId(dto.station_id);
    await this.validateAssignedOfficerId(dto.assigned_officer_id);
    await this.validateAssignedUnitId(dto.assigned_unit_id);

    const status = dto.status ?? CaseStatus.OPEN;
    const caseNumber = await this.generateCaseNumber();

    const caseEntity = this.caseRepo.create({
      case_number: caseNumber,
      summary: dto.summary.trim(),
      priority: dto.priority ?? CasePriority.MEDIUM,
      status,
      district: dto.district?.trim() ?? null,
      province: dto.province?.trim() ?? null,
      victim_name: dto.victim_name?.trim() ?? null,
      sos_event_id: dto.sos_event_id ?? null,
      station_id: dto.station_id ?? null,
      assigned_officer_id: dto.assigned_officer_id ?? null,
      assigned_unit_id: dto.assigned_unit_id ?? null,
      closed_at: status === CaseStatus.CLOSED ? new Date() : null,
    });

    const saved = await this.caseRepo.save(caseEntity);

    await this.statusHistoryRepo.save(
      this.statusHistoryRepo.create({
        case_id: saved.id,
        status,
        changed_by_id: actorUserId ?? null,
      }),
    );

    const hydrated = await this.findCaseOrThrow(saved.id, true);

    return {
      message: 'Case created successfully',
      case: formatCase(hydrated, true),
    };
  }

  async findAll(options: ListCasesOptions) {
    const query = this.caseRepo
      .createQueryBuilder('case')
      .leftJoinAndSelect('case.station', 'station')
      .leftJoinAndSelect('case.assigned_officer', 'assigned_officer')
      .leftJoinAndSelect('case.assigned_unit', 'assigned_unit');

    if (options.status) {
      query.andWhere('case.status = :status', { status: options.status });
    }

    if (options.priority) {
      query.andWhere('case.priority = :priority', {
        priority: options.priority,
      });
    }

    if (options.station_id) {
      query.andWhere('case.station_id = :station_id', {
        station_id: options.station_id,
      });
    }

    if (options.province) {
      query.andWhere('case.province ILIKE :province', {
        province: options.province,
      });
    }

    const skip = (options.page - 1) * options.limit;
    const [cases, total] = await query
      .orderBy('case.opened_at', 'DESC')
      .skip(skip)
      .take(options.limit)
      .getManyAndCount();

    return {
      message: 'Cases retrieved successfully',
      cases: cases.map((c) => formatCase(c)),
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async findOne(id: string) {
    const caseEntity = await this.findCaseOrThrow(id, true);

    return {
      message: 'Case retrieved successfully',
      case: formatCase(caseEntity, true),
    };
  }

  async update(id: string, dto: UpdateCaseDto, actorUserId?: string) {
    const caseEntity = await this.findCaseOrThrow(id);

    if (dto.sos_event_id !== undefined) {
      await this.validateSosEventId(dto.sos_event_id);
      caseEntity.sos_event_id = dto.sos_event_id ?? null;
    }

    if (dto.station_id !== undefined) {
      await this.validateStationId(dto.station_id);
      caseEntity.station_id = dto.station_id ?? null;
    }

    if (dto.assigned_officer_id !== undefined) {
      await this.validateAssignedOfficerId(dto.assigned_officer_id);
      caseEntity.assigned_officer_id = dto.assigned_officer_id ?? null;
    }

    if (dto.assigned_unit_id !== undefined) {
      await this.validateAssignedUnitId(dto.assigned_unit_id);
      caseEntity.assigned_unit_id = dto.assigned_unit_id ?? null;
    }

    if (dto.summary !== undefined) caseEntity.summary = dto.summary.trim();
    if (dto.priority !== undefined) caseEntity.priority = dto.priority;
    if (dto.district !== undefined) {
      caseEntity.district = dto.district?.trim() ?? null;
    }
    if (dto.province !== undefined) {
      caseEntity.province = dto.province?.trim() ?? null;
    }
    if (dto.victim_name !== undefined) {
      caseEntity.victim_name = dto.victim_name?.trim() ?? null;
    }

    if (dto.status !== undefined && dto.status !== caseEntity.status) {
      await this.applyStatusChange(caseEntity, dto.status, actorUserId);
    }

    await this.caseRepo.save(caseEntity);
    const hydrated = await this.findCaseOrThrow(id, true);

    return {
      message: 'Case updated successfully',
      case: formatCase(hydrated, true),
    };
  }

  async updateStatus(id: string, status: CaseStatus, changedById?: string) {
    const caseEntity = await this.findCaseOrThrow(id);

    if (caseEntity.status === status) {
      throw new BadRequestException('Case is already in the requested status');
    }

    await this.applyStatusChange(caseEntity, status, changedById);
    await this.caseRepo.save(caseEntity);
    const hydrated = await this.findCaseOrThrow(id, true);

    return {
      message: 'Case status updated successfully',
      case: formatCase(hydrated, true),
    };
  }

  async addNote(caseId: string, body: string, authorId?: string) {
    await this.findCaseOrThrow(caseId);

    const note = this.noteRepo.create({
      case_id: caseId,
      body: body.trim(),
      author_id: authorId ?? null,
    });

    const saved = await this.noteRepo.save(note);
    const hydrated = await this.noteRepo.findOne({
      where: { id: saved.id },
      relations: ['author'],
    });

    return {
      message: 'Case note added successfully',
      note: formatNote(hydrated!),
    };
  }

  async findForPolice(
    officerUserId: string,
    options?: {
      status?: CaseStatus;
      priority?: CasePriority;
      page?: number;
      limit?: number;
    },
  ) {
    const officer = await this.loadPoliceOfficer(officerUserId);

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;

    const query = this.caseRepo
      .createQueryBuilder('case')
      .leftJoinAndSelect('case.station', 'station')
      .leftJoinAndSelect('case.assigned_officer', 'assigned_officer')
      .leftJoinAndSelect('case.assigned_unit', 'assigned_unit')
      .where('case.station_id = :station_id', {
        station_id: officer.station_id,
      });

    if (options?.status) {
      query.andWhere('case.status = :status', { status: options.status });
    }

    if (options?.priority) {
      query.andWhere('case.priority = :priority', {
        priority: options.priority,
      });
    }

    const skip = (page - 1) * limit;
    const [cases, total] = await query
      .orderBy('case.opened_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      message: 'Cases retrieved successfully',
      cases: cases.map((c) => formatCase(c)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneForPolice(officerUserId: string, caseId: string) {
    const officer = await this.loadPoliceOfficer(officerUserId);
    const caseEntity = await this.findCaseOrThrow(caseId, true);

    if (caseEntity.station_id !== officer.station_id) {
      throw new ForbiddenException('Case is not assigned to your station');
    }

    return {
      message: 'Case retrieved successfully',
      case: formatCase(caseEntity, true),
    };
  }

  async updateForPolice(
    officerUserId: string,
    caseId: string,
    dto: UpdateCaseDto,
  ) {
    const officer = await this.loadPoliceOfficer(officerUserId);
    const caseEntity = await this.findCaseOrThrow(caseId);

    if (caseEntity.station_id !== officer.station_id) {
      throw new ForbiddenException('Case is not assigned to your station');
    }

    return this.update(caseId, dto, officerUserId);
  }

  private async applyStatusChange(
    caseEntity: Case,
    status: CaseStatus,
    changedById?: string,
  ) {
    caseEntity.status = status;
    caseEntity.closed_at = status === CaseStatus.CLOSED ? new Date() : null;

    await this.statusHistoryRepo.save(
      this.statusHistoryRepo.create({
        case_id: caseEntity.id,
        status,
        changed_by_id: changedById ?? null,
      }),
    );
  }

  private async generateCaseNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CASE-${year}-`;

    const latest = await this.caseRepo
      .createQueryBuilder('case')
      .where('case.case_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('case.case_number', 'DESC')
      .getOne();

    let nextSerial = 1;
    if (latest?.case_number) {
      const serialPart = latest.case_number.slice(prefix.length);
      const parsed = parseInt(serialPart, 10);
      if (!Number.isNaN(parsed)) {
        nextSerial = parsed + 1;
      }
    }

    return `${prefix}${String(nextSerial).padStart(4, '0')}`;
  }

  private async findCaseOrThrow(
    id: string,
    includeDetails = false,
  ): Promise<Case> {
    const relations = ['station', 'assigned_officer', 'assigned_unit'];
    if (includeDetails) {
      relations.push('status_history', 'status_history.changed_by', 'notes', 'notes.author');
    }

    const caseEntity = await this.caseRepo.findOne({
      where: { id },
      relations,
      order: includeDetails
        ? {
            status_history: { created_at: 'ASC' },
            notes: { created_at: 'ASC' },
          }
        : undefined,
    });

    if (!caseEntity) {
      throw new NotFoundException('Case not found');
    }

    return caseEntity;
  }

  private async loadPoliceOfficer(officerUserId: string) {
    const officer = await this.userRepo.findOne({
      where: { id: officerUserId },
      select: ['id', 'role', 'station_id'],
    });

    if (!officer) {
      throw new NotFoundException('Officer not found');
    }

    if (officer.role !== Role.POLICE) {
      throw new ForbiddenException('Only police officers can access station cases');
    }

    if (!officer.station_id) {
      throw new ForbiddenException('No police station assigned to this officer');
    }

    return officer;
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

  private async validateAssignedOfficerId(officerId?: string | null) {
    if (!officerId) return;

    const officer = await this.userRepo.findOne({
      where: { id: officerId },
      select: ['id', 'role'],
    });

    if (!officer) {
      throw new NotFoundException('Assigned officer not found');
    }

    if (officer.role !== Role.POLICE) {
      throw new BadRequestException('Assigned officer must have the POLICE role');
    }
  }

  private async validateAssignedUnitId(unitId?: string | null) {
    if (!unitId) return;

    const unit = await this.unitRepo.findOne({
      where: { id: unitId },
      select: ['id'],
    });

    if (!unit) {
      throw new NotFoundException('Assigned patrol unit not found');
    }
  }

  private async validateSosEventId(sosEventId?: string | null) {
    if (!sosEventId) return;

    const event = await this.sosEventRepo.findOne({
      where: { id: sosEventId },
      select: ['id'],
    });

    if (!event) {
      throw new NotFoundException('SOS event not found');
    }
  }
}
