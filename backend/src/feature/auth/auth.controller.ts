import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyResetOtpDto,
} from './dto/auth.dto';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Request password reset OTP' })
  @ApiBody({ type: ForgotPasswordDto })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    const sanitizedEmail = dto.email.trim().toLowerCase();

    return this.authService.forgotPassword(sanitizedEmail);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify reset OTP' })
  @ApiBody({ type: VerifyResetOtpDto })
  @Post('verify-reset-otp')
  verifyResetOtp(@Body() verifyOpt: VerifyResetOtpDto) {
    const sanitizedOtp = verifyOpt.otp.trim();
    const sanitizedEmail = verifyOpt.email.trim().toLowerCase();

    return this.authService.verifyResetOtp({
      email: sanitizedEmail,
      otp: sanitizedOtp,
    });
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Reset password with OTP' })
  @ApiBody({ type: ResetPasswordDto })
  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const sanitizedEmail = resetPasswordDto.email.trim().toLowerCase();
    const newPassword = resetPasswordDto.newPassword.trim();
    const comparePassword = resetPasswordDto.comparePassword.trim();
    const resetToken = resetPasswordDto.resetToken?.trim();

    return this.authService.resetPassword({
      email: sanitizedEmail,
      newPassword,
      comparePassword,
      resetToken,
    });
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @Post('refresh')
  @HttpCode(HttpStatus.NO_CONTENT)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.getCookie(req, 'refresh_token');

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const tokens = await this.authService.refresh(refreshToken);

    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate tokens' })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as {
      userId: string;
      sessionId: string;
      role: string;
    };

    await this.authService.logout(user.userId, user.sessionId);

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }

  private getCookie(req: Request, name: string): string | undefined {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const value = cookies?.[name];

    return typeof value === 'string' ? value : undefined;
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const secure = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
