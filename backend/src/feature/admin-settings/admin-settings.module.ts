import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSettingsAdminController } from './admin-settings-admin.controller';
import { AdminSettingsService } from './admin-settings.service';
import { AdminSetting } from './entities/admin-setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdminSetting])],
  controllers: [AdminSettingsAdminController],
  providers: [AdminSettingsService],
  exports: [AdminSettingsService],
})
export class AdminSettingsModule {}
