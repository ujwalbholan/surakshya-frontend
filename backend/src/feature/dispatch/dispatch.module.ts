import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispatchAdminController } from './dispatch-admin.controller';
import { DispatchService } from './dispatch.service';
import { DispatchEvent } from './entities/dispatch-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DispatchEvent])],
  controllers: [DispatchAdminController],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
