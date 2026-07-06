import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from 'src/feature/device/entities/device.entity';
import { LocationPing } from 'src/feature/device/entities/location-ping.entity';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { NotificationFailure } from 'src/feature/notification/entities/notification-failure.entity';
import { AuditModule } from 'src/feature/audit/audit.module';
import { EmergencyController } from './emergency.controller';
import { EmergencyService } from './emergency.service';

@Module({
  imports: [
    AuditModule,
    TypeOrmModule.forFeature([
      Device,
      LocationPing,
      SosEvent,
      NotificationFailure,
    ]),
  ],
  controllers: [EmergencyController],
  providers: [EmergencyService],
})
export class EmergencyModule {}
