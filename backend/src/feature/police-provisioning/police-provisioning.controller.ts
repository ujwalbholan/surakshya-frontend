import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Roles } from 'src/decorators/roles.decorators';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { CreatePoliceOfficerDto } from './dto/create-police-officer.dto';
import { ListPendingLinksQueryDto } from './dto/list-pending-links-query.dto';
import { RejectStationLinkDto } from './dto/reject-station-link.dto';
import { PoliceProvisioningService } from './police-provisioning.service';

@ApiBearerAuth()
@ApiTags('Admin — Police Provisioning')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/police')
export class PoliceProvisioningController {
  constructor(
    private readonly policeProvisioningService: PoliceProvisioningService,
  ) {}

  @ApiOperation({ summary: 'Create a police officer account' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post('create')
  create(@Body() dto: CreatePoliceOfficerDto, @Req() req: Request) {
    const user = req.user as { userId: string };
    return this.policeProvisioningService.createPoliceAccount(
      user.userId,
      dto,
    );
  }

  @ApiOperation({ summary: 'List pending officer-station link requests' })
  @Roles('SUPER_ADMIN')
  @Get('pending-links')
  listPendingLinks(
    @Query() query: ListPendingLinksQueryDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: string };
    return this.policeProvisioningService.listPendingStationLinks(
      user.userId,
      { page: query.page ?? 1, limit: query.limit ?? 20 },
    );
  }

  @ApiOperation({ summary: 'Approve a pending officer-station link' })
  @ApiParam({ name: 'linkId', format: 'uuid' })
  @Roles('SUPER_ADMIN')
  @Post('pending-links/:linkId/approve')
  approveLink(
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: string };
    return this.policeProvisioningService.approveStationLink(
      user.userId,
      linkId,
    );
  }

  @ApiOperation({ summary: 'Reject a pending officer-station link' })
  @ApiParam({ name: 'linkId', format: 'uuid' })
  @Roles('SUPER_ADMIN')
  @Post('pending-links/:linkId/reject')
  rejectLink(
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @Body() dto: RejectStationLinkDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: string };
    return this.policeProvisioningService.rejectStationLink(
      user.userId,
      linkId,
      dto.reason,
    );
  }

  @ApiOperation({ summary: 'Resend temporary password to a police officer' })
  @ApiParam({ name: 'officerId', format: 'uuid' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post(':officerId/resend-temp-password')
  resendTempPassword(
    @Param('officerId', ParseUUIDPipe) officerId: string,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: string };
    return this.policeProvisioningService.resendTempPassword(
      user.userId,
      officerId,
    );
  }
}
