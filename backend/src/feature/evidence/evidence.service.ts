import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvidenceFileType } from 'src/constants/evidence.constants';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { Case } from 'src/feature/cases/entities/case.entity';
import { User } from 'src/feature/user/entities/user.entity';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { Evidence } from './entities/evidence.entity';

export interface ListEvidenceOptions {
  case_id?: string;
  file_type?: EvidenceFileType;
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

function formatCaseSummary(caseEntity: Case | null | undefined) {
  if (!caseEntity) return null;
  return {
    id: caseEntity.id,
    case_number: caseEntity.case_number,
    status: caseEntity.status,
    priority: caseEntity.priority,
    victim_name: caseEntity.victim_name ?? null,
    district: caseEntity.district ?? null,
    province: caseEntity.province ?? null,
    station_id: caseEntity.station_id ?? null,
  };
}

function formatEvidence(evidence: Evidence) {
  return {
    id: evidence.id,
    case_id: evidence.case_id,
    case: formatCaseSummary(evidence.case),
    file_name: evidence.file_name,
    storage_key: evidence.storage_key,
    mime_type: evidence.mime_type ?? null,
    file_type: evidence.file_type,
    size_bytes: evidence.size_bytes,
    checksum: evidence.checksum,
    uploaded_by_id: evidence.uploaded_by_id,
    uploaded_by: formatUserSummary(evidence.uploaded_by),
    captured_at: evidence.captured_at ?? null,
    created_at: evidence.created_at,
  };
}

@Injectable()
export class EvidenceService {
  constructor(
    @InjectRepository(Evidence)
    private readonly evidenceRepo: Repository<Evidence>,
    @InjectRepository(Case)
    private readonly caseRepo: Repository<Case>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateEvidenceDto, actorUserId: string) {
    await this.validateCaseId(dto.case_id);
    await this.validateUploaderId(actorUserId);

    const evidence = this.evidenceRepo.create({
      case_id: dto.case_id,
      file_name: dto.file_name.trim(),
      storage_key: dto.storage_key.trim(),
      mime_type: dto.mime_type?.trim() ?? null,
      file_type: dto.file_type,
      size_bytes: String(dto.size_bytes),
      checksum: dto.checksum.trim(),
      uploaded_by_id: actorUserId,
      captured_at: dto.captured_at ? new Date(dto.captured_at) : null,
    });

    const saved = await this.evidenceRepo.save(evidence);
    const hydrated = await this.findEvidenceOrThrow(saved.id);

    return {
      message: 'Evidence record created successfully',
      evidence: formatEvidence(hydrated),
    };
  }

  async findAll(options: ListEvidenceOptions) {
    const query = this.evidenceRepo
      .createQueryBuilder('evidence')
      .leftJoinAndSelect('evidence.case', 'case')
      .leftJoinAndSelect('evidence.uploaded_by', 'uploaded_by');

    if (options.case_id) {
      query.andWhere('evidence.case_id = :case_id', {
        case_id: options.case_id,
      });
    }

    if (options.file_type) {
      query.andWhere('evidence.file_type = :file_type', {
        file_type: options.file_type,
      });
    }

    const skip = (options.page - 1) * options.limit;
    const [records, total] = await query
      .orderBy('evidence.created_at', 'DESC')
      .skip(skip)
      .take(options.limit)
      .getManyAndCount();

    return {
      message: 'Evidence records retrieved successfully',
      evidence: records.map(formatEvidence),
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async findOne(id: string) {
    const evidence = await this.findEvidenceOrThrow(id);

    return {
      message: 'Evidence record retrieved successfully',
      evidence: formatEvidence(evidence),
    };
  }

  async findForPolice(
    officerUserId: string,
    options?: {
      case_id?: string;
      file_type?: EvidenceFileType;
      page?: number;
      limit?: number;
    },
  ) {
    const officer = await this.loadPoliceOfficer(officerUserId);

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;

    const query = this.evidenceRepo
      .createQueryBuilder('evidence')
      .leftJoinAndSelect('evidence.case', 'case')
      .leftJoinAndSelect('evidence.uploaded_by', 'uploaded_by')
      .where('case.station_id = :station_id', {
        station_id: officer.station_id,
      });

    if (options?.case_id) {
      query.andWhere('evidence.case_id = :case_id', {
        case_id: options.case_id,
      });
    }

    if (options?.file_type) {
      query.andWhere('evidence.file_type = :file_type', {
        file_type: options.file_type,
      });
    }

    const skip = (page - 1) * limit;
    const [records, total] = await query
      .orderBy('evidence.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      message: 'Evidence records retrieved successfully',
      evidence: records.map(formatEvidence),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneForPolice(officerUserId: string, evidenceId: string) {
    const officer = await this.loadPoliceOfficer(officerUserId);
    const evidence = await this.findEvidenceOrThrow(evidenceId);

    if (evidence.case?.station_id !== officer.station_id) {
      throw new ForbiddenException(
        'Evidence is not associated with your station',
      );
    }

    return {
      message: 'Evidence record retrieved successfully',
      evidence: formatEvidence(evidence),
    };
  }

  private async findEvidenceOrThrow(id: string): Promise<Evidence> {
    const evidence = await this.evidenceRepo.findOne({
      where: { id },
      relations: ['case', 'uploaded_by'],
    });

    if (!evidence) {
      throw new NotFoundException('Evidence record not found');
    }

    return evidence;
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
      throw new ForbiddenException(
        'Only police officers can access station evidence',
      );
    }

    if (!officer.station_id) {
      throw new ForbiddenException('No police station assigned to this officer');
    }

    return officer;
  }

  private async validateCaseId(caseId: string) {
    const caseEntity = await this.caseRepo.findOne({
      where: { id: caseId },
      select: ['id'],
    });

    if (!caseEntity) {
      throw new NotFoundException('Case not found');
    }
  }

  private async validateUploaderId(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id'],
    });

    if (!user) {
      throw new NotFoundException('Uploader not found');
    }
  }
}
