import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreatePoliceOfficerDto {
  @ApiProperty({ example: 'Inspector Ram Sharma' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  full_name!: string;

  @ApiProperty({ example: 'ram.sharma@nepalpolice.gov.np' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+9779801234567' })
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/)
  phone!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  station_id!: string;
}
