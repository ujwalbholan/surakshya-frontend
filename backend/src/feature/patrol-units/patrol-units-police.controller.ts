import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { UnitStatus } from 'src/constants/patrol-units.constants';
import { PatrolUnitsService } from './patrol-units.service';

@ApiBearerAuth()
@ApiTags('Police — Units')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('POLICE', 'ADMIN', 'SUPER_ADMIN')
@Controller('police/units')
export class PatrolUnitsPoliceController {
  constructor(private readonly patrolUnitsService: PatrolUnitsService) {}

  @ApiOperation({ summary: 'List patrol units for the officer station' })
  @ApiQuery({ name: 'status', required: false, enum: UnitStatus })
  @Get()
  findForStation(
    @Req() req: Request,
    @Query('status') status?: UnitStatus,
  ) {
    const user = req.user as { userId: string };
    return this.patrolUnitsService.findForPolice(user.userId, { status });
  }
}
