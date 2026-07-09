import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportRange } from 'src/constants/reports.constants';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { ReportRangeQueryDto } from './dto/report-range-query.dto';
import { ReportsService } from './reports.service';

@ApiBearerAuth()
@ApiTags('Admin — Reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/reports')
export class ReportsAdminController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Get aggregated report summary' })
  @Get('summary')
  getSummary(@Query() query: ReportRangeQueryDto) {
    return this.reportsService.getSummary(query.range ?? ReportRange.THIRTY_DAYS);
  }

  @ApiOperation({ summary: 'Get daily report time series' })
  @Get('daily-series')
  getDailySeries(@Query() query: ReportRangeQueryDto) {
    return this.reportsService.getDailySeries(
      query.range ?? ReportRange.THIRTY_DAYS,
    );
  }

  @ApiOperation({ summary: 'Get per-province SOS and unit breakdown' })
  @Get('province-breakdown')
  getProvinceBreakdown(@Query() query: ReportRangeQueryDto) {
    return this.reportsService.getProvinceBreakdown(
      query.range ?? ReportRange.THIRTY_DAYS,
    );
  }
}
