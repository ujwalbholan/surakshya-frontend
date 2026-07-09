import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SetActivationPasswordDto } from './dto/set-activation-password.dto';
import { VerifyActivationOtpDto } from './dto/verify-activation-otp.dto';
import { PoliceProvisioningService } from './police-provisioning.service';

@ApiTags('Police Activation')
@Controller('police/activation')
export class PoliceActivationController {
  constructor(
    private readonly policeProvisioningService: PoliceProvisioningService,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Set new password during police account activation' })
  @ApiBody({ type: SetActivationPasswordDto })
  @Post('set-password')
  setPassword(@Body() dto: SetActivationPasswordDto) {
    return this.policeProvisioningService.completePoliceActivation(
      dto.challengeToken.trim(),
      dto.newPassword,
    );
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify OTP to complete police account activation' })
  @ApiBody({ type: VerifyActivationOtpDto })
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyActivationOtpDto) {
    return this.policeProvisioningService.verifyPoliceActivationOtp(
      dto.challengeToken.trim(),
      dto.otp.trim(),
    );
  }
}
