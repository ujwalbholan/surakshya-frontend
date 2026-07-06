import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from '../device/entities/device.entity';
import { LocationPing } from '../device/entities/location-ping.entity';
import { SosEvent } from '../device/entities/sos-event.entity';
import { TrackingIngestService } from './tracking-ingest.interface';
import { TrackingGateway } from './tracking.gateway';
import { TrackingService } from './tracking.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, LocationPing, SosEvent]),
    JwtModule.register({}),
  ],
  providers: [
    TrackingService,
    TrackingGateway,
    { provide: TrackingIngestService, useExisting: TrackingService },
  ],
  exports: [TrackingService, TrackingGateway, TrackingIngestService],
})
export class TrackingModule {}
