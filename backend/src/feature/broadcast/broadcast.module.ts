import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModule } from '../notification/notification.module';
import { PoliceStation } from '../police-stations/entities/police-station.entity';
import { TrackingModule } from '../tracking/tracking.module';
import { User } from '../user/entities/user.entity';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { BroadcastAdminController } from './broadcast-admin.controller';
import { BroadcastService } from './broadcast.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PoliceStation]),
    TrackingModule,
    NotificationModule,
  ],
  controllers: [BroadcastAdminController],
  providers: [BroadcastService, RolesGuard],
  exports: [BroadcastService],
})
export class BroadcastModule {}
