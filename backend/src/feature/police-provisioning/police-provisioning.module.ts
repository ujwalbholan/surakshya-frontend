import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/feature/user/entities/user.entity';
import { PoliceStation } from 'src/feature/police-stations/entities/police-station.entity';
import { NotificationModule } from 'src/feature/notification/notification.module';
import { RedisModule } from 'src/config/redis/redis.module';
import { PoliceStationLink } from './entities/police-station-link.entity';
import { PoliceActivationController } from './police-activation.controller';
import { PoliceProvisioningController } from './police-provisioning.controller';
import { PoliceProvisioningService } from './police-provisioning.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PoliceStationLink, PoliceStation]),
    NotificationModule,
    RedisModule,
  ],
  controllers: [PoliceProvisioningController, PoliceActivationController],
  providers: [PoliceProvisioningService],
  exports: [PoliceProvisioningService],
})
export class PoliceProvisioningModule {}
