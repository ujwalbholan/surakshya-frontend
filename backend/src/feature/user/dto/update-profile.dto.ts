import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export class UpdateProfileDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 120, example: 25 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({ enum: BLOOD_TYPES, example: 'O+' })
  @IsOptional()
  @IsIn(BLOOD_TYPES)
  blood_type?: string;
}
