import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBroadcastDto {
  @ApiProperty({ minLength: 1, maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;

  @ApiPropertyOptional({ enum: ['normal', 'high'], default: 'normal' })
  @IsOptional()
  @IsIn(['normal', 'high'])
  priority?: 'normal' | 'high';

  @ApiPropertyOptional({
    description: 'Limit recipients to police officers at this station',
  })
  @IsOptional()
  @IsUUID()
  station_id?: string;

  @ApiPropertyOptional({
    description: 'Also email officers when priority is high',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  send_email?: boolean;
}
