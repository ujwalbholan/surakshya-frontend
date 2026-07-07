import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PoliceSetupService } from './police-setup.service';
import { SetPolicePasswordDto } from './dto/set-police-password.dto';
import { PoliceSendOtpDto } from './dto/police-send-otp.dto';
import { VerifyPoliceOtpDto } from './dto/verify-police-otp.dto';

@ApiTags('Police Setup')
@Controller('police/setup')
export class PoliceSetupController {
  constructor(private readonly policeSetupService: PoliceSetupService) {}

  @ApiOperation({ summary: 'Set new password using invite token' })
  @Post('password')
  setPassword(@Body() dto: SetPolicePasswordDto) {
    return this.policeSetupService.setPassword(dto.token, dto.newPassword);
  }

  @ApiOperation({ summary: 'Send OTP to officer phone' })
  @Post('send-otp')
  sendOtp(@Body() dto: PoliceSendOtpDto) {
    return this.policeSetupService.sendOtp(dto.token);
  }

  @ApiOperation({ summary: 'Verify OTP and activate account' })
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyPoliceOtpDto) {
    return this.policeSetupService.verifyOtp(dto.token, dto.otp);
  }
}
