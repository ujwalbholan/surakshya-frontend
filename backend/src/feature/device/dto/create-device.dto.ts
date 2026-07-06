import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty({ example: 'IMEI123456789' })
  @IsString()
  imei!: string;

  @ApiProperty({ required: false, example: 'My Phone' })
  @IsOptional()
  @IsString()
  label?: string;
}
