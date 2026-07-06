import {
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PoliceService } from './police.service';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { LogLocationAccess } from 'src/feature/audit/decorators/log-location-access.decorator';
import { LocationAccessAuditInterceptor } from 'src/feature/audit/location-access-audit.interceptor';

@ApiBearerAuth()
@ApiTags('Police')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('POLICE', 'ADMIN', 'SUPER_ADMIN')
@Controller('police')
export class PoliceController {
  constructor(private readonly policeService: PoliceService) {}

  @ApiOperation({ summary: 'Get police dashboard stats' })
  @Get('dashboard')
  getDashboard() {
    return this.policeService.getDashboard();
  }

  @ApiOperation({ summary: 'Get active SOS events' })
  @Get('sos-events')
  getActiveSosEvents() {
    return this.policeService.getActiveSosEvents();
  }

  @ApiOperation({ summary: 'Get SOS event details' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get('sos-events/:id')
  getSosEventDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.policeService.getSosEventDetails(id);
  }

  @ApiOperation({ summary: 'Resolve an SOS event' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Patch('sos-events/:id/resolve')
  resolveSosEvent(@Param('id', ParseUUIDPipe) id: string) {
    return this.policeService.resolveSosEvent(id);
  }

  @ApiOperation({ summary: 'Get device latest location' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @LogLocationAccess({
    endpoint: 'GET /police/devices/:id/location',
    deviceIdParam: 'id',
  })
  @UseInterceptors(LocationAccessAuditInterceptor)
  @Get('devices/:id/location')
  getDeviceLatestLocation(@Param('id', ParseUUIDPipe) id: string) {
    return this.policeService.getDeviceLatestLocation(id);
  }

  @ApiOperation({ summary: 'Get user info' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get('users/:id')
  getUserInfo(@Param('id', ParseUUIDPipe) id: string) {
    return this.policeService.getUserInfo(id);
  }

  @ApiOperation({ summary: 'Get user guardians' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get('users/:id/guardians')
  getUserGuardians(@Param('id', ParseUUIDPipe) id: string) {
    return this.policeService.getUserGuardians(id);
  }
}
