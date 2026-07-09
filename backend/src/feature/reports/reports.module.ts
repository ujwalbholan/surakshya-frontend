import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Case } from 'src/feature/cases/entities/case.entity';
import { CaseStatusHistory } from 'src/feature/cases/entities/case-status-history.entity';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { PatrolUnit } from 'src/feature/patrol-units/entities/patrol-unit.entity';
import { User } from 'src/feature/user/entities/user.entity';
import { ReportsAdminController } from './reports-admin.controller';
import { ReportsPoliceController } from './reports-police.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SosEvent,
      Case,
      CaseStatusHistory,
      PatrolUnit,
      User,
    ]),
  ],
  controllers: [ReportsAdminController, ReportsPoliceController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
