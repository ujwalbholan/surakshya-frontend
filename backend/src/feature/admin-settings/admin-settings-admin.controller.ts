import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { AdminSettingsService } from './admin-settings.service';
import { UpdateAdminSettingsDto } from './dto/update-admin-settings.dto';

@ApiBearerAuth()
@ApiTags('Admin — Settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/settings')
export class AdminSettingsAdminController {
  constructor(private readonly adminSettingsService: AdminSettingsService) {}

  @ApiOperation({ summary: 'Get persisted admin settings' })
  @Get()
  getSettings() {
    return this.adminSettingsService.getSettings();
  }

  @ApiOperation({ summary: 'Update admin settings' })
  @Patch()
  updateSettings(@Body() dto: UpdateAdminSettingsDto) {
    return this.adminSettingsService.updateSettings(dto);
  }
}
