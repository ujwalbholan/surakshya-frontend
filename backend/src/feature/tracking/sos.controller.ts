import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from 'src/decorators/roles.decorators';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { CreateSosDto } from './dto/create-sos.dto';
import { UpdateSosLocationDto } from './dto/update-sos-location.dto';
import { TrackingService } from './tracking.service';

type AuthUser = { userId: string; role: string };

@ApiBearerAuth()
@ApiTags('SOS')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sos')
export class SosController {
  constructor(private readonly trackingService: TrackingService) {}

  @ApiOperation({
    summary: "Get the authenticated user's active SOS (if any)",
    description:
      'Looks up the device assigned to this user and returns the latest active SOS event.',
  })
  @Roles('USER', 'ADMIN', 'SUPER_ADMIN')
  @Get('active')
  getActive(@Req() req: Request) {
    const user = req.user as AuthUser;
    return this.trackingService.getActiveSosForUser(user.userId);
  }

  @ApiOperation({
    summary: 'Create an SOS event (citizen app / phone GPS)',
    description:
      'Reuses the same TrackingService ingestion path as MQTT sos_started events.',
  })
  @Roles('USER', 'ADMIN', 'SUPER_ADMIN')
  @Post()
  create(@Req() req: Request, @Body() dto: CreateSosDto) {
    const user = req.user as AuthUser;
    const notesParts = [
      dto.triggerNotes?.trim(),
      dto.label ? `label=${dto.label}` : undefined,
      dto.source ? `source=${dto.source}` : undefined,
    ].filter(Boolean);

    return this.trackingService.startSosForUser(user.userId, {
      latitude: dto.latitude,
      longitude: dto.longitude,
      altitudeM: dto.altitudeM ?? null,
      speedKmph: dto.speedKmph ?? null,
      triggerNotes: notesParts.length > 0 ? notesParts.join('; ') : null,
      connectionType: dto.source ?? 'app',
    });
  }

  @ApiOperation({
    summary: 'Cancel an active SOS from the citizen app',
    description:
      'Resolves the SOS in the database and sends an MQTT sos_cancel command to the linked wearable.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Roles('USER', 'ADMIN', 'SUPER_ADMIN')
  @Post(':id/cancel')
  cancel(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
    const user = req.user as AuthUser;
    return this.trackingService.cancelSosForUser(user.userId, id);
  }

  @ApiOperation({
    summary: 'Append a live location update to an active SOS event',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Roles('USER', 'ADMIN', 'SUPER_ADMIN', 'POLICE')
  @Post(':id/location')
  updateLocation(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSosLocationDto,
  ) {
    const user = req.user as AuthUser;
    return this.trackingService.appendSosLocationForActor(
      id,
      {
        latitude: dto.latitude,
        longitude: dto.longitude,
        altitudeM: dto.altitudeM ?? null,
        speedKmph: dto.speedKmph ?? null,
      },
      { userId: user.userId, role: user.role },
    );
  }
}
