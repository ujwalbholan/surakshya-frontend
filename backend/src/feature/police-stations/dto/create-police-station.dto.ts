import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreatePoliceStationDto {
  @ApiProperty({ example: 'Kathmandu Metropolitan Police' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'Durbar Marg, Kathmandu' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  address!: string;

  @ApiProperty({ example: '+9779801234567' })
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/)
  contact_number!: string;
}
