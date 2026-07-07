import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignDeviceDto {
  @ApiProperty({ format: 'uuid', description: 'Citizen user id (role USER)' })
  @IsUUID()
  userId!: string;
}
