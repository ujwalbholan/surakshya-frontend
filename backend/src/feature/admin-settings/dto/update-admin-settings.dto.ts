import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class NotificationChannelsDto {
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @IsOptional()
  @IsBoolean()
  push?: boolean;

  @IsOptional()
  @IsBoolean()
  sms?: boolean;
}

class NotificationsSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationChannelsDto)
  newSos?: NotificationChannelsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationChannelsDto)
  sosUnack?: NotificationChannelsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationChannelsDto)
  newUser?: NotificationChannelsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationChannelsDto)
  caseChange?: NotificationChannelsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationChannelsDto)
  systemHealth?: NotificationChannelsDto;
}

export class UpdateAdminSettingsDto {
  @ApiPropertyOptional({ example: 'Surakshya' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  platform_name?: string;

  @ApiPropertyOptional({ example: 'support@surakshya.com.np' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  support_email?: string;

  @ApiPropertyOptional({ example: 'English' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  language?: string;

  @ApiPropertyOptional({ example: '30 min' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  session_timeout?: string;

  @ApiPropertyOptional({ example: 'https://surakshya.onrender.com' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  api_url?: string;

  @ApiPropertyOptional({ example: '10s' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  api_timeout?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NotificationsSettingsDto)
  notifications?: NotificationsSettingsDto;
}
