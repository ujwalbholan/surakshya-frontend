import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export class UpdateProfileDto {
  @ApiPropertyOptional({ maxLength: 100, example: 'Pooja Singh' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty()
  @MaxLength(100)
  full_name?: string;

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
