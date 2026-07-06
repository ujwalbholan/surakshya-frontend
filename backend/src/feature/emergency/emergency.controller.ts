import {
  Controller,
  Get,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { EmergencyService } from './emergency.service';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { LogLocationAccess } from 'src/feature/audit/decorators/log-location-access.decorator';
import { LocationAccessAuditInterceptor } from 'src/feature/audit/location-access-audit.interceptor';

@ApiBearerAuth()
@ApiTags('Emergency')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('POLICE', 'ADMIN', 'SUPER_ADMIN')
@Controller('emergency')
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  @ApiOperation({ summary: 'Dashboard summary statistics' })
  @Get('dashboard')
  getDashboard() {
    return this.emergencyService.getDashboardSummary();
  }

  @ApiOperation({ summary: 'Live emergencies – active SOS events' })
  @Get('live')
  getLiveEmergencies() {
    return this.emergencyService.getLiveEmergencies();
  }

  @ApiOperation({ summary: 'Alert counts by period (today/week)' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['today', 'week'],
    description: 'Defaults to today',
  })
  @Get('alerts')
  getAlerts(@Query('period') period?: 'today' | 'week') {
    return this.emergencyService.getAlerts(period ?? 'today');
  }

  @ApiOperation({ summary: 'Police workload overview' })
  @Get('workload')
  getWorkload() {
    return this.emergencyService.getWorkload();
  }

  @ApiOperation({ summary: 'Unresolved incidents (active SOS events)' })
  @Get('incidents/unresolved')
  getUnresolvedIncidents() {
    return this.emergencyService.getUnresolvedIncidents();
  }

  @ApiOperation({ summary: 'Cases needing action (active SOS in last 6h)' })
  @Get('cases/needing-action')
  getCasesNeedingAction() {
    return this.emergencyService.getCasesNeedingAction();
  }

  @ApiOperation({ summary: 'Registered devices with online status' })
  @Get('devices')
  getDeviceStatus() {
    return this.emergencyService.getDeviceStatus();
  }

  @ApiOperation({ summary: 'Map view – last known user locations' })
  @LogLocationAccess({
    endpoint: 'GET /emergency/map',
    mapBulk: true,
  })
  @UseInterceptors(LocationAccessAuditInterceptor)
  @Get('map')
  getMapView() {
    return this.emergencyService.getMapView();
  }

  @ApiOperation({ summary: 'Notification delivery failures' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['sms', 'email'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('notification-failures')
  getNotificationFailures(
    @Query('type') type?: 'sms' | 'email',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.emergencyService.getNotificationFailures(
      page ?? 1,
      limit ?? 20,
      type,
    );
  }
}
