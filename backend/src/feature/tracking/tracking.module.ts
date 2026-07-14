import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from '../device/entities/device.entity';
import { LocationPing } from '../device/entities/location-ping.entity';
import { SosEvent } from '../device/entities/sos-event.entity';
import { PoliceStation } from '../police-stations/entities/police-station.entity';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { TrackingIngestService } from './tracking-ingest.interface';
import { TrackingGateway } from './tracking.gateway';
import { TrackingService } from './tracking.service';
import { SosController } from './sos.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, LocationPing, SosEvent, PoliceStation]),
    JwtModule.register({}),
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
