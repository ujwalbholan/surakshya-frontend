import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectStationLinkDto {
  @ApiProperty({ example: 'Officer assigned to wrong district station.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
