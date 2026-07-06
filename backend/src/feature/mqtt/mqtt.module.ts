import { Module } from '@nestjs/common';
import { TrackingModule } from '../tracking/tracking.module';
import { MqttService } from './mqtt.service';

@Module({
  imports: [TrackingModule],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
