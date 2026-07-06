import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { Device } from './entities/device.entity';
import { LocationPing } from './entities/location-ping.entity';
import { SosEvent } from './entities/sos-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Device, LocationPing, SosEvent])],
  controllers: [DeviceController],
  providers: [DeviceService],
  exports: [TypeOrmModule],
})
export class DeviceModule {}
