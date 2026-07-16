import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SetActivationPasswordDto } from '../police-provisioning/dto/set-activation-password.dto';
import { VerifyActivationOtpDto } from '../police-provisioning/dto/verify-activation-otp.dto';
import { GuardianService } from './guardian.service';

class GuardianActivationChallengeDto {
  challengeToken!: string;
}

@ApiTags('Guardian Activation')
@Controller('guardian/activation')
export class GuardianActivationController {
  constructor(private readonly guardianService: GuardianService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Set new password during guardian account activation',
  })
  @ApiBody({ type: SetActivationPasswordDto })
  @Post('set-password')
  setPassword(@Body() dto: SetActivationPasswordDto) {
    return this.guardianService.completeGuardianActivation(
      dto.challengeToken.trim(),
      dto.newPassword,
    );
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Verify phone OTP to complete guardian account activation',
  })
  @ApiBody({ type: VerifyActivationOtpDto })
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyActivationOtpDto) {
    return this.guardianService.verifyGuardianActivationOtp(
      dto.challengeToken.trim(),
      dto.otp.trim(),
    );
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Resend guardian activation OTP to email and phone',
  })
  @Post('resend-otp')
  resendOtp(@Body() dto: GuardianActivationChallengeDto) {
    return this.guardianService.resendGuardianActivationOtp(
      dto.challengeToken.trim(),
    );
  }
}
