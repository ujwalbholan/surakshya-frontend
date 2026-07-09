/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportRange } from 'src/constants/reports.constants';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { Case } from 'src/feature/cases/entities/case.entity';
import { CaseStatusHistory } from 'src/feature/cases/entities/case-status-history.entity';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { PatrolUnit } from 'src/feature/patrol-units/entities/patrol-unit.entity';
import { User } from 'src/feature/user/entities/user.entity';
import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let sosRepo: jest.Mocked<Repository<SosEvent>>;
  let caseRepo: jest.Mocked<Repository<Case>>;
  let caseStatusHistoryRepo: jest.Mocked<Repository<CaseStatusHistory>>;
  let unitRepo: jest.Mocked<Repository<PatrolUnit>>;
  let userRepo: jest.Mocked<Repository<User>>;

  const createQueryBuilderMock = (getRawManyResult: unknown[] = []) => {
    const qb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
      getRawOne: jest.fn().mockResolvedValue({ avgMinutes: '4.5' }),
      getRawMany: jest.fn().mockResolvedValue(getRawManyResult),
    };
    return qb;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(SosEvent),
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Case),
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CaseStatusHistory),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PatrolUnit),
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ReportsService);
    sosRepo = module.get(getRepositoryToken(SosEvent));
    caseRepo = module.get(getRepositoryToken(Case));
    caseStatusHistoryRepo = module.get(getRepositoryToken(CaseStatusHistory));
    unitRepo = module.get(getRepositoryToken(PatrolUnit));
    userRepo = module.get(getRepositoryToken(User));
  });

  describe('parseRange', () => {
    it('maps 7d to a seven-day window', () => {
      const window = service.parseRange(ReportRange.SEVEN_DAYS);
      expect(window.days).toBe(7);
      expect(window.to.getTime()).toBeGreaterThan(window.from.getTime());
    });
  });

  describe('getSummary', () => {
    it('returns aggregated summary metrics', async () => {
      const sosQb = createQueryBuilderMock();
      sosQb.getCount
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8);
      sosRepo.createQueryBuilder.mockReturnValue(sosQb as never);
      caseRepo.count.mockResolvedValue(3);
      unitRepo.count.mockResolvedValue(2);

      const result = await service.getSummary(ReportRange.THIRTY_DAYS);

      expect(result.total_sos).toBe(10);
      expect(result.resolved_count).toBe(8);
      expect(result.avg_response_minutes).toBe('4.5');
      expect(result.resolution_rate).toBe(80);
      expect(result.active_cases).toBe(3);
      expect(result.units_dispatched).toBe(2);
    });

    it('returns zero resolution rate when no SOS events exist', async () => {
      const sosQb = createQueryBuilderMock();
      sosQb.getCount.mockResolvedValue(0);
      sosQb.getRawOne.mockResolvedValue({ avgMinutes: null });
      sosRepo.createQueryBuilder.mockReturnValue(sosQb as never);
      caseRepo.count.mockResolvedValue(0);
      unitRepo.count.mockResolvedValue(0);

      const result = await service.getSummary(ReportRange.SEVEN_DAYS);

      expect(result.resolution_rate).toBe(0);
      expect(result.avg_response_minutes).toBe('0.0');
    });
  });

  describe('getSummaryForPolice', () => {
    it('throws when officer is not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getSummaryForPolice('missing-officer', ReportRange.SEVEN_DAYS),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when officer has no station', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'officer-1',
        role: Role.POLICE,
        station_id: null,
      } as User);

      await expect(
        service.getSummaryForPolice('officer-1', ReportRange.SEVEN_DAYS),
      ).rejects.toThrow(ForbiddenException);
    });

    it('scopes summary to the officer station', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'officer-1',
        role: Role.POLICE,
        station_id: 'station-1',
      } as User);

      const sosQb = createQueryBuilderMock();
      sosQb.getCount.mockResolvedValue(2);
      sosRepo.createQueryBuilder.mockReturnValue(sosQb as never);
      caseRepo.count.mockResolvedValue(1);
      unitRepo.count.mockResolvedValue(1);

      await service.getSummaryForPolice('officer-1', ReportRange.SEVEN_DAYS);

      expect(sosQb.andWhere).toHaveBeenCalledWith(
        'sos.assigned_station_id = :station_id',
        { station_id: 'station-1' },
      );
    });
  });

  describe('getDailySeries', () => {
    it('returns a continuous day series', async () => {
      const day = new Date();
      day.setHours(0, 0, 0, 0);

      sosRepo.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock([{ day, count: '2' }]) as never,
      );
      caseRepo.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock() as never,
      );
      caseStatusHistoryRepo.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock() as never,
      );
      userRepo.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock() as never,
      );

      const result = await service.getDailySeries(ReportRange.SEVEN_DAYS);

      expect(result.series).toHaveLength(7);
      expect(result.series[0]).toMatchObject({
        sos: expect.any(Number),
        resolved: expect.any(Number),
        open: expect.any(Number),
        escalated: expect.any(Number),
        users: expect.any(Number),
        minutes: expect.any(Number),
      });
    });
  });

  describe('getProvinceBreakdown', () => {
    it('merges SOS and unit counts by province', async () => {
      sosRepo.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock([
          {
            province: 'Bagmati',
            total_sos: '5',
            resolved: '4',
            avg_response_minutes: '4.2',
          },
        ]) as never,
      );
      unitRepo.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock([{ province: 'Bagmati', units: '2' }]) as never,
      );

      const result = await service.getProvinceBreakdown(ReportRange.THIRTY_DAYS);

      expect(result.provinces).toEqual([
        {
          province: 'Bagmati',
          total_sos: 5,
          resolved: 4,
          avg_response_minutes: 4.2,
          units: 2,
          avg_response: '4.2',
          resolution_rate: 80,
        },
      ]);
    });
  });
});
