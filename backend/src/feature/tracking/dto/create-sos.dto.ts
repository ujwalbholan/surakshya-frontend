import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateSosDto {
  @ApiProperty({ example: 27.7172 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ example: 85.324 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({ description: 'Human-readable place label' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string;

  @ApiPropertyOptional({
    description: 'Trigger source, e.g. wristband_double_tap or app_button',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  triggerNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  altitudeM?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  speedKmph?: number;
}
