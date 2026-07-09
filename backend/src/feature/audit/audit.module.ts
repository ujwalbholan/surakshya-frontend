import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditAdminController } from './audit-admin.controller';
import { AuditLogService } from './audit-log.service';
import { AuditLog } from './entities/audit-log.entity';
import { LocationAccessLog } from './entities/location-access-log.entity';
import { LocationAccessAuditInterceptor } from './location-access-audit.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([LocationAccessLog, AuditLog])],
  controllers: [AuditAdminController],
  providers: [LocationAccessAuditInterceptor, AuditLogService],
  exports: [LocationAccessAuditInterceptor, AuditLogService, TypeOrmModule],
})
export class AuditModule {}
