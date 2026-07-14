import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenModule } from 'src/utils/token/token.module';
import { PoliceProvisioningModule } from 'src/feature/police-provisioning/police-provisioning.module';
import { GuardianModule } from 'src/feature/guardian/guardian.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TokenModule,
    PoliceProvisioningModule,
    GuardianModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
