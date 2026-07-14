import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesMatrixAdminController } from './roles-matrix-admin.controller';
import { RolesMatrixService } from './roles-matrix.service';
import { RolePermission } from './entities/role-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RolePermission])],
  controllers: [RolesMatrixAdminController],
  providers: [RolesMatrixService],
  exports: [RolesMatrixService],
})
export class RolesMatrixModule {}
