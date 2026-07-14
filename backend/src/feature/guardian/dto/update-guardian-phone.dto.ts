import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class UpdateGuardianPhoneDto {
  @ApiProperty({ example: '9842183759' })
  @IsString()
  @Matches(/^(\+977)?9[678]\d{8}$/, {
    message: 'Phone must be a valid Nepal mobile number',
  })
  phone!: string;
}
