import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { EvidenceFileType } from 'src/constants/evidence.constants';

export class CreateEvidenceDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  case_id!: string;

  @ApiProperty({ example: 'recording_2026-03-09.aes' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  file_name!: string;

  @ApiProperty({
    example: 'evidence/case-uuid/recording_2026-03-09.aes',
    description: 'S3 or local storage path key (metadata only in v1)',
  })
  @IsString()
  @IsNotEmpty()
  storage_key!: string;

  @ApiPropertyOptional({ example: 'audio/aes' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mime_type?: string;

  @ApiProperty({ enum: EvidenceFileType })
  @IsEnum(EvidenceFileType)
  file_type!: EvidenceFileType;

  @ApiProperty({ example: 245760, description: 'File size in bytes' })
  @IsInt()
  @Min(0)
  size_bytes!: number;

  @ApiProperty({
    example: 'a3b5c7d9e1f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2',
    description: 'SHA-256 hex digest',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  checksum!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsString()
  captured_at?: string;
}
