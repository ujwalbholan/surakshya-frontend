import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CaseStatus } from 'src/constants/cases.constants';
import { UnitStatus } from 'src/constants/patrol-units.constants';
import {
  REPORT_RANGE_DAYS,
  ReportRange,
} from 'src/constants/reports.constants';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { Case } from 'src/feature/cases/entities/case.entity';
import { CaseStatusHistory } from 'src/feature/cases/entities/case-status-history.entity';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { PatrolUnit } from 'src/feature/patrol-units/entities/patrol-unit.entity';
import { User } from 'src/feature/user/entities/user.entity';
import { In, Repository } from 'typeorm';

export interface ReportDateWindow {
  from: Date;
  to: Date;
  days: number;
}

interface SummaryScope {
  station_id?: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(SosEvent)
    private readonly sosRepo: Repository<SosEvent>,
    @InjectRepository(Case)
    private readonly caseRepo: Repository<Case>,
    @InjectRepository(CaseStatusHistory)
    private readonly caseStatusHistoryRepo: Repository<CaseStatusHistory>,
    @InjectRepository(PatrolUnit)
    private readonly unitRepo: Repository<PatrolUnit>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  parseRange(range: ReportRange = ReportRange.THIRTY_DAYS): ReportDateWindow {
    const days = REPORT_RANGE_DAYS[range] ?? REPORT_RANGE_DAYS[ReportRange.THIRTY_DAYS];
    const to = new Date();
    const from = new Date(to);
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - (days - 1));

    return { from, to, days };
  }

  async getSummary(range: ReportRange = ReportRange.THIRTY_DAYS, scope: SummaryScope = {}) {
    const window = this.parseRange(range);
    const [
      totalSos,
      resolvedCount,
      avgResponseMinutes,
      activeCases,
      unitsDispatched,
    ] = await Promise.all([
      this.countSosInWindow(window, scope),
      this.countResolvedSosInWindow(window, scope),
      this.avgResponseMinutesInWindow(window, scope),
      this.countActiveCases(scope),
      this.countDispatchedUnits(scope),
    ]);

    const resolutionRate =
      totalSos > 0 ? Math.round((resolvedCount / totalSos) * 100) : 0;

    return {
      message: 'Report summary retrieved successfully',
      range,
      total_sos: totalSos,
      resolved_count: resolvedCount,
      avg_response_minutes: avgResponseMinutes.toFixed(1),
      resolution_rate: resolutionRate,
      active_cases: activeCases,
      units_dispatched: unitsDispatched,
    };
  }

  async getSummaryForPolice(
    officerUserId: string,
    range: ReportRange = ReportRange.THIRTY_DAYS,
  ) {
    const officer = await this.loadPoliceOfficer(officerUserId);
    return this.getSummary(range, { station_id: officer.station_id! });
  }

  async getDailySeries(
    range: ReportRange = ReportRange.THIRTY_DAYS,
    scope: SummaryScope = {},
  ) {
    const window = this.parseRange(range);
    const [sosByDay, resolvedByDay, openByDay, escalatedByDay, usersByDay, minutesByDay] =
      await Promise.all([
        this.groupSosStartedByDay(window, scope),
        this.groupSosResolvedByDay(window, scope),
        this.groupCasesOpenedByDay(window, scope),
        this.groupCasesEscalatedByDay(window, scope),
        this.groupUsersCreatedByDay(window),
        this.groupAvgResponseByDay(window, scope),
      ]);

    const series = this.buildDayKeys(window).map((dayKey) => ({
      date: this.formatChartDate(new Date(dayKey)),
      sos: sosByDay.get(dayKey) ?? 0,
      resolved: resolvedByDay.get(dayKey) ?? 0,
      open: openByDay.get(dayKey) ?? 0,
      escalated: escalatedByDay.get(dayKey) ?? 0,
      users: usersByDay.get(dayKey) ?? 0,
      minutes: Number((minutesByDay.get(dayKey) ?? 0).toFixed(1)),
    }));

    return {
      message: 'Daily report series retrieved successfully',
      range,
      series,
    };
  }

  async getProvinceBreakdown(
    range: ReportRange = ReportRange.THIRTY_DAYS,
  ) {
    const window = this.parseRange(range);
    const [sosRows, unitRows] = await Promise.all([
      this.groupSosByProvince(window),
      this.groupUnitsByProvince(),
    ]);

    const provinceMap = new Map<
      string,
      {
        province: string;
        total_sos: number;
        resolved: number;
        avg_response_minutes: number;
        units: number;
      }
    >();

    for (const row of sosRows) {
      const province = row.province ?? 'Unknown';
      provinceMap.set(province, {
        province,
        total_sos: Number(row.total_sos),
        resolved: Number(row.resolved),
        avg_response_minutes: Number(row.avg_response_minutes ?? 0),
        units: 0,
      });
    }

    for (const row of unitRows) {
      const province = row.province;
      const existing = provinceMap.get(province) ?? {
        province,
        total_sos: 0,
        resolved: 0,
        avg_response_minutes: 0,
        units: 0,
      };
      existing.units = Number(row.units);
      provinceMap.set(province, existing);
    }

    const provinces = Array.from(provinceMap.values())
      .map((row) => ({
        ...row,
        avg_response: row.avg_response_minutes.toFixed(1),
        resolution_rate:
          row.total_sos > 0
            ? Math.round((row.resolved / row.total_sos) * 100)
            : 0,
      }))
      .sort((a, b) => b.total_sos - a.total_sos);

    return {
      message: 'Province breakdown retrieved successfully',
      range,
      provinces,
    };
  }

  private async countSosInWindow(window: ReportDateWindow, scope: SummaryScope) {
    const qb = this.sosRepo
      .createQueryBuilder('sos')
      .where('sos.startedAt BETWEEN :from AND :to', {
        from: window.from,
        to: window.to,
      });

    this.applySosStationScope(qb, scope);
    return qb.getCount();
  }

  private async countResolvedSosInWindow(
    window: ReportDateWindow,
    scope: SummaryScope,
  ) {
    const qb = this.sosRepo
      .createQueryBuilder('sos')
      .where('sos.status = :status', { status: 'resolved' })
      .andWhere('sos.startedAt BETWEEN :from AND :to', {
        from: window.from,
        to: window.to,
      });

    this.applySosStationScope(qb, scope);
    return qb.getCount();
  }

  private async avgResponseMinutesInWindow(
    window: ReportDateWindow,
    scope: SummaryScope,
  ) {
    const qb = this.sosRepo
      .createQueryBuilder('sos')
      .select(
        'AVG(EXTRACT(EPOCH FROM (sos.resolvedAt - sos.startedAt)) / 60)',
        'avgMinutes',
      )
      .where('sos.status = :status', { status: 'resolved' })
      .andWhere('sos.resolvedAt IS NOT NULL')
      .andWhere('sos.startedAt BETWEEN :from AND :to', {
        from: window.from,
        to: window.to,
      });

    this.applySosStationScope(qb, scope);
    const row = await qb.getRawOne<{ avgMinutes: string | null }>();
    return row?.avgMinutes ? Number(row.avgMinutes) : 0;
  }

  private async countActiveCases(scope: SummaryScope) {
    const where: Record<string, unknown> = {
      status: In([
        CaseStatus.OPEN,
        CaseStatus.INVESTIGATING,
        CaseStatus.ESCALATED,
      ]),
    };

    if (scope.station_id) {
      where.station_id = scope.station_id;
    }

    return this.caseRepo.count({ where });
  }

  private async countDispatchedUnits(scope: SummaryScope) {
    const where: Record<string, unknown> = {
      status: In([UnitStatus.DISPATCHED, UnitStatus.ON_SCENE]),
    };

    if (scope.station_id) {
      where.station_id = scope.station_id;
    }

    return this.unitRepo.count({ where });
  }

  private async groupSosStartedByDay(
    window: ReportDateWindow,
    scope: SummaryScope,
  ) {
    const qb = this.sosRepo
      .createQueryBuilder('sos')
      .select("DATE_TRUNC('day', sos.startedAt)", 'day')
      .addSelect('COUNT(*)', 'count')
      .where('sos.startedAt BETWEEN :from AND :to', {
        from: window.from,
        to: window.to,
      })
      .groupBy("DATE_TRUNC('day', sos.startedAt)");

    this.applySosStationScope(qb, scope);
    const rows = await qb.getRawMany<{ day: Date; count: string }>();
    return this.mapDayCounts(rows);
  }

  private async groupSosResolvedByDay(
    window: ReportDateWindow,
    scope: SummaryScope,
  ) {
    const qb = this.sosRepo
      .createQueryBuilder('sos')
      .select("DATE_TRUNC('day', sos.resolvedAt)", 'day')
      .addSelect('COUNT(*)', 'count')
      .where('sos.status = :status', { status: 'resolved' })
      .andWhere('sos.resolvedAt BETWEEN :from AND :to', {
        from: window.from,
        to: window.to,
      })
      .groupBy("DATE_TRUNC('day', sos.resolvedAt)");

    this.applySosStationScope(qb, scope);
    const rows = await qb.getRawMany<{ day: Date; count: string }>();
    return this.mapDayCounts(rows);
  }

  private async groupCasesOpenedByDay(
    window: ReportDateWindow,
    scope: SummaryScope,
  ) {
    const qb = this.caseRepo
      .createQueryBuilder('case')
      .select("DATE_TRUNC('day', case.opened_at)", 'day')
      .addSelect('COUNT(*)', 'count')
      .where('case.opened_at BETWEEN :from AND :to', {
        from: window.from,
        to: window.to,
      })
      .groupBy("DATE_TRUNC('day', case.opened_at)");

    if (scope.station_id) {
      qb.andWhere('case.station_id = :station_id', {
        station_id: scope.station_id,
      });
    }

    const rows = await qb.getRawMany<{ day: Date; count: string }>();
    return this.mapDayCounts(rows);
  }

  private async groupCasesEscalatedByDay(
    window: ReportDateWindow,
    scope: SummaryScope,
  ) {
    const qb = this.caseStatusHistoryRepo
      .createQueryBuilder('history')
      .innerJoin('history.case', 'case')
      .select("DATE_TRUNC('day', history.created_at)", 'day')
      .addSelect('COUNT(*)', 'count')
      .where('history.status = :status', { status: CaseStatus.ESCALATED })
      .andWhere('history.created_at BETWEEN :from AND :to', {
        from: window.from,
        to: window.to,
      })
      .groupBy("DATE_TRUNC('day', history.created_at)");

    if (scope.station_id) {
      qb.andWhere('case.station_id = :station_id', {
        station_id: scope.station_id,
      });
    }

    const rows = await qb.getRawMany<{ day: Date; count: string }>();
    return this.mapDayCounts(rows);
  }

  private async groupUsersCreatedByDay(window: ReportDateWindow) {
    const rows = await this.userRepo
      .createQueryBuilder('user')
      .select("DATE_TRUNC('day', user.created_at)", 'day')
      .addSelect('COUNT(*)', 'count')
      .where('user.created_at BETWEEN :from AND :to', {
        from: window.from,
        to: window.to,
      })
      .groupBy("DATE_TRUNC('day', user.created_at)")
      .getRawMany<{ day: Date; count: string }>();

    return this.mapDayCounts(rows);
  }

  private async groupAvgResponseByDay(
    window: ReportDateWindow,
    scope: SummaryScope,
  ) {
    const qb = this.sosRepo
      .createQueryBuilder('sos')
      .select("DATE_TRUNC('day', sos.resolvedAt)", 'day')
      .addSelect(
        'AVG(EXTRACT(EPOCH FROM (sos.resolvedAt - sos.startedAt)) / 60)',
        'avgMinutes',
      )
      .where('sos.status = :status', { status: 'resolved' })
      .andWhere('sos.resolvedAt BETWEEN :from AND :to', {
        from: window.from,
        to: window.to,
      })
      .groupBy("DATE_TRUNC('day', sos.resolvedAt)");

    this.applySosStationScope(qb, scope);
    const rows = await qb.getRawMany<{ day: Date; avgMinutes: string }>();
    const map = new Map<string, number>();

    for (const row of rows) {
      if (!row.day) continue;
      map.set(this.dayKey(row.day), Number(row.avgMinutes ?? 0));
    }

    return map;
  }

  private async groupSosByProvince(window: ReportDateWindow) {
    return this.sosRepo
      .createQueryBuilder('sos')
      .leftJoin(Case, 'case', 'case.sos_event_id = sos.id')
      .select('case.province', 'province')
      .addSelect('COUNT(sos.id)', 'total_sos')
      .addSelect(
        "COUNT(CASE WHEN sos.status = 'resolved' THEN 1 END)",
        'resolved',
      )
      .addSelect(
        'AVG(CASE WHEN sos.status = \'resolved\' AND sos.resolvedAt IS NOT NULL THEN EXTRACT(EPOCH FROM (sos.resolvedAt - sos.startedAt)) / 60 END)',
        'avg_response_minutes',
      )
      .where('sos.startedAt BETWEEN :from AND :to', {
        from: window.from,
        to: window.to,
      })
      .groupBy('case.province')
      .getRawMany<{
        province: string | null;
        total_sos: string;
        resolved: string;
        avg_response_minutes: string | null;
      }>();
  }

  private async groupUnitsByProvince() {
    return this.unitRepo
      .createQueryBuilder('unit')
      .select('unit.province', 'province')
      .addSelect('COUNT(*)', 'units')
      .groupBy('unit.province')
      .getRawMany<{ province: string; units: string }>();
  }

  private applySosStationScope(
    qb: ReturnType<Repository<SosEvent>['createQueryBuilder']>,
    scope: SummaryScope,
  ) {
    if (scope.station_id) {
      qb.andWhere('sos.assigned_station_id = :station_id', {
        station_id: scope.station_id,
      });
    }
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
        'Only police officers can access station reports',
      );
    }

    if (!officer.station_id) {
      throw new ForbiddenException('No police station assigned to this officer');
    }

    return officer;
  }

  private buildDayKeys(window: ReportDateWindow) {
    const keys: string[] = [];
    const cursor = new Date(window.from);

    while (cursor <= window.to) {
      keys.push(this.dayKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return keys;
  }

  private mapDayCounts(rows: Array<{ day: Date; count: string }>) {
    const map = new Map<string, number>();

    for (const row of rows) {
      if (!row.day) continue;
      map.set(this.dayKey(row.day), Number(row.count));
    }

    return map;
  }

  private dayKey(date: Date) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized.toISOString().slice(0, 10);
  }

  private formatChartDate(date: Date) {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  }
}
