import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateSosLocationDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  altitudeM?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  speedKmph?: number;
}
