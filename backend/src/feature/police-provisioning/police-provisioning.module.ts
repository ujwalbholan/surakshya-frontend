import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/feature/user/entities/user.entity';
import { PoliceStation } from 'src/feature/police-stations/entities/police-station.entity';
import { NotificationModule } from 'src/feature/notification/notification.module';
import { RedisModule } from 'src/config/redis/redis.module';
import { PoliceStationLink } from './entities/police-station-link.entity';
import { PoliceProvisioningService } from './police-provisioning.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PoliceStationLink, PoliceStation]),
    NotificationModule,
    RedisModule,
  ],
  providers: [PoliceProvisioningService],
  exports: [PoliceProvisioningService],
})
export class PoliceProvisioningModule {}
