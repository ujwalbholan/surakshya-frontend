import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateGuardianDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MinLength(4, { message: 'Must be more than 4 characters' })
  @MaxLength(15, { message: 'Must be less then 15 characters' })
  full_name!: string;

  @ApiProperty({ example: '+97798XXXXXXXX' })
  @IsString()
  @Matches(/^(\+977)?9[678]\d{8}$/, {
    message: 'Phone must be a valid Nepal mobile number',
  })
  phone!: string;

  @ApiProperty({ example: 'guardian@example.com' })
  @IsEmail()
  email!: string;
}
