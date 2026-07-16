import { Module, forwardRef } from '@nestjs/common';
import { TrackingModule } from '../tracking/tracking.module';
import { MqttService } from './mqtt.service';

@Module({
  imports: [forwardRef(() => TrackingModule)],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
