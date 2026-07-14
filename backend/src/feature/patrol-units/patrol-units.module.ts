import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispatchModule } from 'src/feature/dispatch/dispatch.module';
import { PoliceStation } from 'src/feature/police-stations/entities/police-station.entity';
import { User } from 'src/feature/user/entities/user.entity';
import { PatrolUnit } from './entities/patrol-unit.entity';
import { PatrolUnitsService } from './patrol-units.service';
import { PatrolUnitsAdminController } from './patrol-units-admin.controller';
import { PatrolUnitsPoliceController } from './patrol-units-police.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PatrolUnit, PoliceStation, User]),
    DispatchModule,
  ],
  controllers: [PatrolUnitsAdminController, PatrolUnitsPoliceController],
  providers: [PatrolUnitsService],
  exports: [PatrolUnitsService],
})
export class PatrolUnitsModule {}
