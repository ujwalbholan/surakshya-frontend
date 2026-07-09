import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportRange } from 'src/constants/reports.constants';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { ReportRangeQueryDto } from './dto/report-range-query.dto';
import { ReportsService } from './reports.service';

@ApiBearerAuth()
@ApiTags('Police — Reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('POLICE', 'ADMIN', 'SUPER_ADMIN')
@Controller('police/reports')
export class ReportsPoliceController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Get station-scoped report summary' })
  @Get('summary')
  getSummary(@Req() req: Request, @Query() query: ReportRangeQueryDto) {
    const user = req.user as { userId: string };
    return this.reportsService.getSummaryForPolice(
      user.userId,
      query.range ?? ReportRange.THIRTY_DAYS,
    );
  }
}
