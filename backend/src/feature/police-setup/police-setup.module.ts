import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoliceInvite } from 'src/feature/police-invites/entities/police-invite.entity';
import { User } from 'src/feature/user/entities/user.entity';
import { NotificationModule } from 'src/feature/notification/notification.module';
import { RedisModule } from 'src/config/redis/redis.module';
import { PoliceSetupController } from './police-setup.controller';
import { PoliceSetupService } from './police-setup.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PoliceInvite, User]),
    NotificationModule,
    RedisModule,
  ],
  controllers: [PoliceSetupController],
  providers: [PoliceSetupService],
})
export class PoliceSetupModule {}
