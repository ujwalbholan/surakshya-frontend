import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomInt } from 'node:crypto';
import { PoliceInvite } from 'src/feature/police-invites/entities/police-invite.entity';
import { User } from 'src/feature/user/entities/user.entity';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { NotificationService } from 'src/feature/notification/notification.service';
import { RedisService } from 'src/config/redis/redis.service';

const OTP_TTL_SECONDS = 5 * 60;
const MAX_OTP_SENDS_PER_HOUR = 3;
const MAX_VERIFY_ATTEMPTS = 5;

@Injectable()
export class PoliceSetupService {
  private readonly logger = new Logger(PoliceSetupService.name);

  constructor(
    @InjectRepository(PoliceInvite)
    private readonly inviteRepo: Repository<PoliceInvite>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationService: NotificationService,
    private readonly redisService: RedisService,
  ) {}

  async setPassword(token: string, newPassword: string) {
    const invite = await this.findValidInvite(token);

    const user = await this.userRepo.findOne({
      where: { email: invite.email, role: Role.POLICE },
    });
    if (!user) {
      throw new BadRequestException(
        'This invite link is invalid or has expired',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepo.update(
      { id: user.id },
      { password_hash: passwordHash },
    );

    return {
      message:
        'Password updated successfully. Please verify your phone via OTP.',
    };
  }

  async sendOtp(token: string) {
    const invite = await this.findValidInvite(token);
    const tokenHash = this.hashToken(token);

    const sendCount = await this.redisService.incr(
      `police:otp:sends:${tokenHash}`,
      3600,
    );
    if (sendCount > MAX_OTP_SENDS_PER_HOUR) {
      throw new HttpException(
        'Too many OTP requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.userRepo.findOne({
      where: { email: invite.email, role: Role.POLICE },
    });
    if (!user) {
      throw new BadRequestException(
        'This invite link is invalid or has expired',
      );
    }

    const otp = randomInt(100000, 999999).toString();
    const hashOtp = await bcrypt.hash(otp, 12);
    await this.redisService.set(
      `police:otp:${tokenHash}`,
      hashOtp,
      OTP_TTL_SECONDS,
    );
    await this.redisService.del(`police:otp:verify:${tokenHash}`);

    try {
      await this.notificationService.sendSms({
        to: user.phone,
        message: `Hello ${user.full_name}, your Surakshya Police Portal verification OTP is: ${otp}. It expires in 5 minutes.`,
      });
    } catch {
      this.logger.error(`Failed to send OTP SMS to ${user.phone}`);
      throw new BadRequestException(
        'Unable to send OTP. Please try again later.',
      );
    }

    return { message: 'OTP sent to your registered phone number' };
  }

  async verifyOtp(token: string, otp: string) {
    const invite = await this.findValidInvite(token);
    const tokenHash = this.hashToken(token);
    const otpKey = `police:otp:${tokenHash}`;
    const verifyKey = `police:otp:verify:${tokenHash}`;

    const attemptCount = await this.redisService.incr(
      verifyKey,
      OTP_TTL_SECONDS,
    );
    if (attemptCount > MAX_VERIFY_ATTEMPTS) {
      throw new HttpException(
        'Too many verification attempts. Please request a new OTP.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const hashedOtp = await this.redisService.get(otpKey);
    if (!hashedOtp) {
      throw new BadRequestException('OTP expired or invalid');
    }

    const isValid = await bcrypt.compare(otp.trim(), hashedOtp);
    if (!isValid) {
      throw new BadRequestException('OTP expired or invalid');
    }

    await this.redisService.del(otpKey);
    await this.redisService.del(verifyKey);

    const user = await this.userRepo.findOne({
      where: { email: invite.email, role: Role.POLICE },
    });
    if (!user) {
      throw new BadRequestException(
        'This invite link is invalid or has expired',
      );
    }

    await this.userRepo.update(
      { id: user.id },
      { phone_verified: true, is_active: true },
    );
    await this.inviteRepo.update({ id: invite.id }, { used_at: new Date() });

    return {
      message:
        'Account activated successfully. You can now log in with your new password.',
    };
  }

  private async findValidInvite(token: string): Promise<PoliceInvite> {
    const tokenHash = this.hashToken(token);
    const invite = await this.inviteRepo.findOne({
      where: { token_hash: tokenHash },
    });

    if (!invite || invite.used_at || invite.expires_at < new Date()) {
      throw new BadRequestException(
        'This invite link is invalid or has expired',
      );
    }

    return invite;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
