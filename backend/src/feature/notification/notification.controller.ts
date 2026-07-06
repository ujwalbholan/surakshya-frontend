import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { IsString, IsNotEmpty } from 'class-validator';

class SendSmsDto {
  @ApiProperty({ example: '+97798XXXXXXXX' })
  @IsString()
  @IsNotEmpty()
  to!: string;

  @ApiProperty({ example: 'Your SOS alert has been received.' })
  @IsString()
  @IsNotEmpty()
  message!: string;
}

class SendEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  @IsNotEmpty()
  to!: string;

  @ApiProperty({ example: 'Alert Notification' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({ example: 'Plain text body' })
  @IsString()
  @IsNotEmpty()
  text!: string;

  @ApiProperty({ example: '<p>HTML body</p>' })
  @IsString()
  @IsNotEmpty()
  html!: string;
}

@ApiBearerAuth()
@ApiTags('Notification')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN', 'POLICE')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({ summary: 'Send an SMS notification' })
  @ApiBody({ type: SendSmsDto })
  @Post('send-sms')
  sendSms(@Body() dto: SendSmsDto) {
    return this.notificationService.sendSms(dto);
  }

  @ApiOperation({ summary: 'Send an email notification' })
  @ApiBody({ type: SendEmailDto })
  @Post('send-email')
  sendEmail(@Body() dto: SendEmailDto) {
    return this.notificationService.sendEmail(dto);
  }
}
