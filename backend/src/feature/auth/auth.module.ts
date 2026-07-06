import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/feature/user/user.module';
import { TokenModule } from 'src/utils/token/token.module';
import { RedisModule } from 'src/config/redis/redis.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [UserModule, TokenModule, RedisModule, NotificationModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
