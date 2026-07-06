import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GuardianService } from './guardian.service';
import { SendOtpDto, VerifyOtpDto } from './dto/verify-otp.dto';
import { SetPasswordDto } from './dto/set-password.dto';

@ApiTags('Guardian Setup')
@Controller('guardian')
export class GuardianSetupController {
  constructor(private readonly guardianService: GuardianService) {}

  @ApiOperation({ summary: 'Send OTP to guardian phone for verification' })
  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.guardianService.sendOtp(dto.email.trim().toLowerCase());
  }

  @ApiOperation({ summary: 'Verify OTP and mark phone as verified' })
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.guardianService.verifyOtp(
      dto.email.trim().toLowerCase(),
      dto.otp.trim(),
    );
  }

  @ApiOperation({ summary: 'Set new password after OTP verification' })
  @Post('set-password')
  setPassword(@Body() dto: SetPasswordDto) {
    return this.guardianService.setPassword(
      dto.email.trim().toLowerCase(),
      dto.oldPassword,
      dto.newPassword,
    );
  }
}
