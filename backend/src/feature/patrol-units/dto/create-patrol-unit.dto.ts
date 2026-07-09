import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { UnitStatus } from 'src/constants/patrol-units.constants';

export class CreatePatrolUnitDto {
  @ApiProperty({ example: 'Unit 12 — Metro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'NP-01-001-2345' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  vehicle!: string;

  @ApiProperty({ example: 'Kathmandu Metro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  zone!: string;

  @ApiProperty({ example: 'Bagmati' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  province!: string;

  @ApiPropertyOptional({ enum: UnitStatus, default: UnitStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  station_id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  lead_officer_id?: string;

  @ApiPropertyOptional({ example: '+9779801234567' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/)
  contact_phone?: string;

  @ApiPropertyOptional({ example: 27.7172 })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ example: 85.324 })
  @IsOptional()
  @IsLongitude()
  longitude?: number;
}
