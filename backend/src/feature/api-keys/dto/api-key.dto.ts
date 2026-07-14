import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Production Mobile App' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;
}

export class UpdateApiKeyDto {
  @ApiPropertyOptional({ example: 'Police Dashboard' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;
}
