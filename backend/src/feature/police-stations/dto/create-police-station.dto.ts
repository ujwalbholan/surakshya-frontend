import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

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

  @ApiPropertyOptional({ example: 27.7172 })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ example: 85.324 })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ example: 'ChIJ...' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  place_id?: string;

  @ApiPropertyOptional({ example: 'Durbar Marg, Kathmandu 44600, Nepal' })
  @IsOptional()
  @IsString()
  formatted_address?: string;
}
