import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/feature/user/entities/user.entity';
import { Device } from 'src/feature/device/entities/device.entity';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { LocationPing } from 'src/feature/device/entities/location-ping.entity';
import { GuardianLink } from './entities/guardian-link.entity';
import { GuardianRequest } from './entities/guardian-request.entity';
import { GuardianService } from './guardian.service';
import { GuardianController } from './guardian.controller';
import { GuardianWardController } from './guardian-ward.controller';
import { GuardianSetupController } from './guardian-setup.controller';
import { GuardianActivationController } from './guardian-activation.controller';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { NotificationModule } from '../notification/notification.module';
import { RedisService } from 'src/config/redis/redis.service';
import { MqttModule } from '../mqtt/mqtt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      GuardianLink,
      GuardianRequest,
      Device,
      SosEvent,
      LocationPing,
    ]),
    NotificationModule,
    MqttModule,
  ],
  controllers: [
    GuardianController,
    GuardianWardController,
    GuardianSetupController,
    GuardianActivationController,
  ],
  providers: [GuardianService, RolesGuard, RedisService],
  exports: [GuardianService],
})
export class GuardianModule {}
