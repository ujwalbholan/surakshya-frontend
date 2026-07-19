import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from '../device/entities/device.entity';
import { LocationPing } from '../device/entities/location-ping.entity';
import { SosEvent } from '../device/entities/sos-event.entity';
import { PoliceStation } from '../police-stations/entities/police-station.entity';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { MqttModule } from '../mqtt/mqtt.module';
import { TrackingIngestService } from './tracking-ingest.interface';
import { TrackingGateway } from './tracking.gateway';
import { TrackingService } from './tracking.service';
import { SosController } from './sos.controller';
import { GuardianLink } from '../guardian/entities/guardian-link.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Device,
      LocationPing,
      SosEvent,
      PoliceStation,
      GuardianLink,
    ]),
    JwtModule.register({}),
    forwardRef(() => MqttModule),
    NotificationModule,
  ],
  controllers: [SosController],
  providers: [
    TrackingService,
    TrackingGateway,
    RolesGuard,
    { provide: TrackingIngestService, useExisting: TrackingService },
  ],
  exports: [TrackingService, TrackingGateway, TrackingIngestService],
})
export class TrackingModule {}
