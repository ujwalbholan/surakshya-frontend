import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoliceInvite } from './entities/police-invite.entity';
import { PoliceStation } from 'src/feature/police-stations/entities/police-station.entity';
import { User } from 'src/feature/user/entities/user.entity';
import { NotificationModule } from 'src/feature/notification/notification.module';
import { PoliceInvitesController } from './police-invites.controller';
import { PoliceInvitesService } from './police-invites.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PoliceInvite, PoliceStation, User]),
    NotificationModule,
  ],
  controllers: [PoliceInvitesController],
  providers: [PoliceInvitesService],
  exports: [PoliceInvitesService],
})
export class PoliceInvitesModule {}
