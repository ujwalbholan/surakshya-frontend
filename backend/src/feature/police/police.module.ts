import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/feature/user/entities/user.entity';
import { Device } from 'src/feature/device/entities/device.entity';
import { LocationPing } from 'src/feature/device/entities/location-ping.entity';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { GuardianLink } from 'src/feature/guardian/entities/guardian-link.entity';
import { AuditModule } from 'src/feature/audit/audit.module';
import { TrackingModule } from 'src/feature/tracking/tracking.module';
import { PoliceController } from './police.controller';
import { PoliceService } from './police.service';

@Module({
  imports: [
    AuditModule,
    TrackingModule,
    TypeOrmModule.forFeature([
      User,
      Device,
      LocationPing,
      SosEvent,
      GuardianLink,
    ]),
  ],
  controllers: [PoliceController],
  providers: [PoliceService],
})
export class PoliceModule {}
