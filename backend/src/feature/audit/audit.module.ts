import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationAccessLog } from './entities/location-access-log.entity';
import { LocationAccessAuditInterceptor } from './location-access-audit.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([LocationAccessLog])],
  providers: [LocationAccessAuditInterceptor],
  exports: [LocationAccessAuditInterceptor, TypeOrmModule],
})
export class AuditModule {}
