import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PoliceSendOtpDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;
}
