import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DispatchEventAction } from 'src/constants/dispatch.constants';
import { DispatchEvent } from './entities/dispatch-event.entity';

export interface RecordDispatchEventInput {
  action: DispatchEventAction;
  unit_id?: string | null;
  unit_name?: string | null;
  case_id?: string | null;
  case_number?: string | null;
  officer_id?: string | null;
  officer_name?: string | null;
  metadata?: Record<string, unknown> | null;
}

function formatDispatchEvent(event: DispatchEvent) {
  return {
    id: event.id,
    time: event.created_at.toISOString(),
    unit: event.unit_name ?? event.unit?.name ?? '—',
    case: event.case_number ?? event.case?.case_number ?? '—',
    officer: event.officer_name ?? event.officer?.full_name ?? '—',
    action: event.action,
    unit_id: event.unit_id ?? null,
    case_id: event.case_id ?? null,
    officer_id: event.officer_id ?? null,
    created_at: event.created_at,
  };
}

@Injectable()
export class DispatchService {
  constructor(
    @InjectRepository(DispatchEvent)
    private readonly dispatchEventRepo: Repository<DispatchEvent>,
  ) {}

  async record(input: RecordDispatchEventInput) {
    const event = this.dispatchEventRepo.create({
      action: input.action,
      unit_id: input.unit_id ?? null,
      unit_name: input.unit_name ?? null,
      case_id: input.case_id ?? null,
      case_number: input.case_number ?? null,
      officer_id: input.officer_id ?? null,
      officer_name: input.officer_name ?? null,
      metadata: input.metadata ?? null,
    });

    const saved = await this.dispatchEventRepo.save(event);
    return saved;
  }

  async findAll(options?: { page?: number; limit?: number }) {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 50, 100);
    const skip = (page - 1) * limit;

    const [events, total] = await this.dispatchEventRepo.findAndCount({
      relations: ['unit', 'case', 'officer'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      message: 'Dispatch events retrieved successfully',
      events: events.map(formatDispatchEvent),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
