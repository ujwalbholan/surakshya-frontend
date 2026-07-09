import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction, AuditResult } from 'src/constants/audit.constants';
import { User } from 'src/feature/user/entities/user.entity';
import { AuditLog } from './entities/audit-log.entity';

export interface RecordAuditLogInput {
  actor_user_id?: string | null;
  actor_role: string;
  action: AuditAction;
  target_entity_type?: string | null;
  target_entity_id?: string | null;
  target_label?: string | null;
  ip_address?: string | null;
  result: AuditResult;
  metadata?: Record<string, unknown> | null;
}

export interface ListAuditLogsOptions {
  action?: AuditAction;
  actor_user_id?: string;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}

function formatActorSummary(actor: User | null | undefined) {
  if (!actor) return null;
  return {
    id: actor.id,
    full_name: actor.full_name,
    email: actor.email,
    phone: actor.phone,
  };
}

function formatResultLabel(result: AuditResult): 'Success' | 'Failed' {
  return result === AuditResult.SUCCESS ? 'Success' : 'Failed';
}

function formatAuditLog(log: AuditLog) {
  return {
    id: log.id,
    actor_user_id: log.actor_user_id ?? null,
    actor: formatActorSummary(log.actor),
    actor_role: log.actor_role,
    action: log.action,
    target_entity_type: log.target_entity_type ?? null,
    target_entity_id: log.target_entity_id ?? null,
    target_label: log.target_label ?? null,
    ip_address: log.ip_address ?? null,
    result: log.result,
    result_label: formatResultLabel(log.result),
    metadata: log.metadata ?? null,
    created_at: log.created_at,
  };
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async record(input: RecordAuditLogInput): Promise<AuditLog> {
    const log = this.auditLogRepo.create({
      actor_user_id: input.actor_user_id ?? null,
      actor_role: input.actor_role,
      action: input.action,
      target_entity_type: input.target_entity_type ?? null,
      target_entity_id: input.target_entity_id ?? null,
      target_label: input.target_label ?? null,
      ip_address: input.ip_address ?? null,
      result: input.result,
      metadata: input.metadata ?? null,
    });

    return this.auditLogRepo.save(log);
  }

  async findAll(options: ListAuditLogsOptions) {
    const query = this.auditLogRepo
      .createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.actor', 'actor');

    if (options.action) {
      query.andWhere('audit_log.action = :action', { action: options.action });
    }

    if (options.actor_user_id) {
      query.andWhere('audit_log.actor_user_id = :actor_user_id', {
        actor_user_id: options.actor_user_id,
      });
    }

    if (options.from) {
      query.andWhere('audit_log.created_at >= :from', { from: options.from });
    }

    if (options.to) {
      query.andWhere('audit_log.created_at <= :to', { to: options.to });
    }

    const skip = (options.page - 1) * options.limit;
    const [records, total] = await query
      .orderBy('audit_log.created_at', 'DESC')
      .skip(skip)
      .take(options.limit)
      .getManyAndCount();

    return {
      message: 'Audit logs retrieved successfully',
      audit_logs: records.map(formatAuditLog),
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async findOne(id: string) {
    const log = await this.findAuditLogOrThrow(id);

    return {
      message: 'Audit log retrieved successfully',
      audit_log: formatAuditLog(log),
    };
  }

  private async findAuditLogOrThrow(id: string): Promise<AuditLog> {
    const log = await this.auditLogRepo.findOne({
      where: { id },
      relations: ['actor'],
    });

    if (!log) {
      throw new NotFoundException('Audit log not found');
    }

    return log;
  }
}
