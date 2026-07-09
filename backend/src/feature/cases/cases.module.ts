import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { PatrolUnit } from 'src/feature/patrol-units/entities/patrol-unit.entity';
import { PoliceStation } from 'src/feature/police-stations/entities/police-station.entity';
import { User } from 'src/feature/user/entities/user.entity';
import { CaseNote } from './entities/case-note.entity';
import { CaseStatusHistory } from './entities/case-status-history.entity';
import { Case } from './entities/case.entity';
import { CasesService } from './cases.service';
import { CasesAdminController } from './cases-admin.controller';
import { CasesPoliceController } from './cases-police.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Case,
      CaseStatusHistory,
      CaseNote,
      PoliceStation,
      User,
      PatrolUnit,
      SosEvent,
    ]),
  ],
  controllers: [CasesAdminController, CasesPoliceController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}
