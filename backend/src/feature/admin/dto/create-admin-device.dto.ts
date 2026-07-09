import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAdminDeviceDto {
  @ApiProperty({
    example: 'wearable-001',
    description: 'Band ID from firmware DEVICE_ID',
  })
  @IsString()
  @MinLength(1)
  imei!: string;

  @ApiProperty({ required: false, example: 'Bikram Band' })
  @IsOptional()
  @IsString()
  label?: string;
}
