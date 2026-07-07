import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { PoliceInvitesService } from './police-invites.service';
import { InvitePoliceOfficerDto } from './dto/invite-police-officer.dto';

@ApiBearerAuth()
@ApiTags('Admin — Police Invites')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/police')
export class PoliceInvitesController {
  constructor(private readonly policeInvitesService: PoliceInvitesService) {}

  @ApiOperation({ summary: 'Invite a police officer' })
  @Post('invite')
  invite(@Body() dto: InvitePoliceOfficerDto, @Req() req: Request) {
    const user = req.user as { userId: string };
    return this.policeInvitesService.invite(dto, user.userId);
  }
}
