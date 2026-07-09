import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ReportRange } from 'src/constants/reports.constants';

export class ReportRangeQueryDto {
  @ApiPropertyOptional({
    enum: ReportRange,
    default: ReportRange.THIRTY_DAYS,
    description: 'Time window for report aggregation',
  })
  @IsOptional()
  @IsEnum(ReportRange)
  range?: ReportRange = ReportRange.THIRTY_DAYS;
}
