import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CasePriority, CaseStatus } from 'src/constants/cases.constants';

export class CreateCaseDto {
  @ApiProperty({ example: 'Distress call from victim near Durbar Marg' })
  @IsString()
  @IsNotEmpty()
  summary!: string;

  @ApiPropertyOptional({ enum: CasePriority, default: CasePriority.MEDIUM })
  @IsOptional()
  @IsEnum(CasePriority)
  priority?: CasePriority;

  @ApiPropertyOptional({ enum: CaseStatus, default: CaseStatus.OPEN })
  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;

  @ApiPropertyOptional({ example: 'Kathmandu' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @ApiPropertyOptional({ example: 'Bagmati' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  province?: string;

  @ApiPropertyOptional({ example: 'Sita Sharma' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  victim_name?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sos_event_id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  station_id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assigned_officer_id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assigned_unit_id?: string;
}
