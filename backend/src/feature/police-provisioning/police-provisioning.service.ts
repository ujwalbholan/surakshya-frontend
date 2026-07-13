import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import {
  PoliceAccountStatus,
  PoliceStationLinkStatus,
  POLICE_LOGIN_BLOCKED_REASON,
  TEMP_PASSWORD_EXPIRY_HOURS,
  TEMP_PASSWORD_LENGTH,
  TEMP_PASSWORD_MAX_RESEND_ATTEMPTS_PER_DAY,
  TEMP_PASSWORD_RESEND_COOLDOWN_MINUTES,
} from 'src/constants/police-provisioning.constants';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { PoliceStation } from 'src/feature/police-stations/entities/police-station.entity';
import { User } from 'src/feature/user/entities/user.entity';
import { NotificationService } from 'src/feature/notification/notification.service';
import { OtpEmailService } from 'src/feature/notification/email/otp.email';
import { RedisService } from 'src/config/redis/redis.service';
import { PoliceStationLink } from './entities/police-station-link.entity';
import { CreatePoliceOfficerDto } from './dto/create-police-officer.dto';
import {
  PoliceLoginChallengeResult,
  POLICE_ACTIVATION_CHALLENGE_TTL_SECONDS,
  POLICE_ACTIVATION_MAX_OTP_SENDS_PER_HOUR,
  POLICE_ACTIVATION_MAX_OTP_VERIFY_ATTEMPTS,
  POLICE_ACTIVATION_OTP_TTL_SECONDS,
  policeActivationChallengeKey,
  policeActivationOtpKey,
  policeActivationOtpVerifyKey,
} from './police-provisioning.types';

const ACTIVATION_PASSWORD_MIN_LENGTH = 8;

@Injectable()
export class PoliceProvisioningService {
  private readonly logger = new Logger(PoliceProvisioningService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(PoliceStationLink)
    private readonly linkRepo: Repository<PoliceStationLink>,
    @InjectRepository(PoliceStation)
    private readonly stationRepo: Repository<PoliceStation>,
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
    private readonly otpEmailService: OtpEmailService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async createPoliceAccount(adminId: string, dto: CreatePoliceOfficerDto) {
    const station = await this.stationRepo.findOneBy({ id: dto.station_id });
    if (!station) {
      throw new NotFoundException('Police station not found');
    }

    const email = dto.email.trim().toLowerCase();
    const phone = this.normalizePhone(dto.phone);

    const existingUser = await this.userRepo.findOne({
      where: [{ email }, { phone }],
    });
    if (existingUser) {
      throw new ConflictException(
        'A user with this email or phone already exists',
      );
    }

    const tempPassword = this.generateTempPassword();
    const tempPasswordHash = await bcrypt.hash(tempPassword, 12);
    const expiresAt = new Date(
      Date.now() + TEMP_PASSWORD_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let userId: string;

    try {
      const user = await queryRunner.manager.save(
        queryRunner.manager.create(User, {
          full_name: dto.full_name.trim(),
          email,
          phone,
          role: Role.POLICE,
          is_active: false,
          phone_verified: false,
          police_account_status: PoliceAccountStatus.PENDING_ACTIVATION,
          must_change_password: true,
          temp_password_hash: tempPasswordHash,
          temp_password_expires_at: expiresAt,
          temp_password_resend_count: 0,
        }),
      );

      userId = user.id;

      await queryRunner.manager.save(
        queryRunner.manager.create(PoliceStationLink, {
          requested_by_admin_id: adminId,
          officer_id: user.id,
          station_id: dto.station_id,
          status: PoliceStationLinkStatus.PENDING,
        }),
      );

      await this.sendProvisioningEmail(
        email,
        dto.full_name.trim(),
        tempPassword,
        TEMP_PASSWORD_EXPIRY_HOURS,
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Failed to create police account for ${email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new BadGatewayException(
        'Failed to send provisioning email. No account was created.',
      );
    } finally {
      await queryRunner.release();
    }

    return {
      message: 'Police officer account created successfully',
      email,
      user_id: userId,
    };
  }

  async resendTempPassword(adminId: string, officerId: string) {
    void adminId;

    const officer = await this.userRepo.findOne({
      where: { id: officerId, role: Role.POLICE },
    });

    if (!officer) {
      throw new NotFoundException('Police officer not found');
    }

    if (officer.police_account_status === PoliceAccountStatus.SUSPENDED) {
      throw new BadRequestException('This officer account is suspended');
    }

    if (officer.police_account_status === PoliceAccountStatus.ACTIVE) {
      throw new BadRequestException(
        'This officer has already completed activation',
      );
    }

    this.enforceResendLimits(officer);

    const tempPassword = this.generateTempPassword();
    const tempPasswordHash = await bcrypt.hash(tempPassword, 12);
    const expiresAt = new Date(
      Date.now() + TEMP_PASSWORD_EXPIRY_HOURS * 60 * 60 * 1000,
    );
    const now = new Date();

    await this.userRepo.update(
      { id: officerId },
      {
        temp_password_hash: tempPasswordHash,
        temp_password_expires_at: expiresAt,
        must_change_password: true,
        temp_password_resend_count: officer.temp_password_resend_count + 1,
        temp_password_last_resend_at: now,
      },
    );

    try {
      await this.sendProvisioningEmail(
        officer.email,
        officer.full_name,
        tempPassword,
        TEMP_PASSWORD_EXPIRY_HOURS,
      );
    } catch (error) {
      this.logger.error(
        `Failed to resend temp password for officer ${officerId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new BadGatewayException('Failed to send provisioning email');
    }

    return {
      message: 'Temporary password resent successfully',
      email: officer.email,
    };
  }

  async listPendingStationLinks(
    superAdminId: string,
    options: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    await this.assertSuperAdmin(superAdminId);

    const skip = (options.page - 1) * options.limit;
    const [links, total] = await this.linkRepo.findAndCount({
      where: { status: PoliceStationLinkStatus.PENDING },
      relations: ['officer', 'station', 'requested_by_admin'],
      order: { created_at: 'ASC' },
      skip,
      take: options.limit,
    });

    return {
      message: 'Pending station links retrieved successfully',
      links: links.map((link) => ({
        id: link.id,
        officer: {
          id: link.officer.id,
          full_name: link.officer.full_name,
          email: link.officer.email,
          phone: link.officer.phone,
        },
        station: {
          id: link.station.id,
          name: link.station.name,
          address: link.station.address,
        },
        requested_by: {
          id: link.requested_by_admin.id,
          full_name: link.requested_by_admin.full_name,
          email: link.requested_by_admin.email,
        },
        created_at: link.created_at,
      })),
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async approveStationLink(superAdminId: string, linkId: string) {
    await this.assertSuperAdmin(superAdminId);

    const link = await this.linkRepo.findOne({
      where: { id: linkId },
      relations: ['officer'],
    });

    if (!link) {
      throw new NotFoundException('Station link request not found');
    }

    if (link.status !== PoliceStationLinkStatus.PENDING) {
      throw new BadRequestException(
        'This link request has already been processed',
      );
    }

    link.status = PoliceStationLinkStatus.APPROVED;
    link.reviewed_by_super_admin_id = superAdminId;
    link.reviewed_at = new Date();

    await this.linkRepo.save(link);

    return {
      message: 'Station link approved successfully',
      link_id: link.id,
    };
  }

  async rejectStationLink(
    superAdminId: string,
    linkId: string,
    reason: string,
  ) {
    await this.assertSuperAdmin(superAdminId);

    const link = await this.linkRepo.findOne({
      where: { id: linkId },
      relations: ['officer', 'requested_by_admin'],
    });

    if (!link) {
      throw new NotFoundException('Station link request not found');
    }

    if (link.status !== PoliceStationLinkStatus.PENDING) {
      throw new BadRequestException(
        'This link request has already been processed',
      );
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      throw new BadRequestException('Rejection reason is required');
    }

    link.status = PoliceStationLinkStatus.REJECTED;
    link.reviewed_by_super_admin_id = superAdminId;
    link.reviewed_at = new Date();
    link.rejection_reason = trimmedReason;

    await this.linkRepo.save(link);

    await this.userRepo.update(
      { id: link.officer_id },
      {
        police_account_status: PoliceAccountStatus.SUSPENDED,
        is_active: false,
      },
    );

    try {
      await this.notificationService.sendEmail({
        to: link.requested_by_admin.email,
        subject: 'Police station link request rejected',
        text: `The station link request for officer ${link.officer.full_name} (${link.officer.email}) was rejected.\n\nReason: ${trimmedReason}`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>Station Link Rejected</h2>
            <p>The station link request for <strong>${link.officer.full_name}</strong> (${link.officer.email}) was rejected.</p>
            <p><strong>Reason:</strong> ${trimmedReason}</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(
        `Failed to notify admin ${link.requested_by_admin_id} of link rejection: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return {
      message: 'Station link rejected successfully',
      link_id: link.id,
    };
  }

  async evaluatePoliceLogin(
    user: User,
    password: string,
  ): Promise<PoliceLoginChallengeResult | null> {
    if (user.role !== Role.POLICE) {
      return null;
    }

    if (user.police_account_status === PoliceAccountStatus.SUSPENDED) {
      this.throwPoliceLoginBlocked(
        POLICE_LOGIN_BLOCKED_REASON.LINK_REJECTED,
        'Your station assignment was not approved. Contact your administrator.',
      );
    }

    const link = await this.findOfficerStationLink(user.id);

    if (!link || link.status === PoliceStationLinkStatus.PENDING) {
      this.throwPoliceLoginBlocked(
        POLICE_LOGIN_BLOCKED_REASON.LINK_PENDING,
        'Your account is created but your station assignment is still awaiting approval.',
      );
    }

    if (link.status === PoliceStationLinkStatus.REJECTED) {
      this.throwPoliceLoginBlocked(
        POLICE_LOGIN_BLOCKED_REASON.LINK_REJECTED,
        'Your station assignment was not approved. Contact your administrator.',
      );
    }

    if (user.must_change_password) {
      if (
        user.temp_password_expires_at &&
        user.temp_password_expires_at < new Date()
      ) {
        this.throwPoliceLoginBlocked(
          POLICE_LOGIN_BLOCKED_REASON.TEMP_PASSWORD_EXPIRED,
          'Your temporary password has expired. Contact your administrator.',
        );
      }

      if (!user.temp_password_hash) {
        throw new UnauthorizedException('Invalid Password');
      }

      const tempMatches = await bcrypt.compare(
        password,
        user.temp_password_hash,
      );

      if (!tempMatches) {
        throw new UnauthorizedException('Invalid Password');
      }

      const challengeToken = await this.issueActivationChallenge(user.id);

      return {
        message: 'Password change required before activation',
        requiresPasswordChange: true,
        challengeToken,
      };
    }

    if (user.police_account_status === PoliceAccountStatus.PENDING_ACTIVATION) {
      if (!user.password_hash) {
        throw new UnauthorizedException(
          'Please complete account activation before logging in.',
        );
      }

      const passwordMatches = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatches) {
        throw new UnauthorizedException('Invalid Password');
      }

      const challengeToken = await this.issueActivationChallenge(user.id);
      await this.sendActivationOtp(challengeToken, user.email);

      return {
        message:
          'Account activation incomplete. Enter the OTP sent to your email.',
        requiresActivationOtp: true,
        challengeToken,
      };
    }

    if (user.police_account_status !== PoliceAccountStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Account is not active. Please contact an administrator.',
      );
    }

    return null;
  }

  private async issueActivationChallenge(userId: string): Promise<string> {
    const challengeToken = randomUUID();
    await this.redisService.set(
      policeActivationChallengeKey(challengeToken),
      userId,
      POLICE_ACTIVATION_CHALLENGE_TTL_SECONDS,
    );
    return challengeToken;
  }

  async completePoliceActivation(challengeToken: string, newPassword: string) {
    const userId = await this.resolveChallengeToken(challengeToken);
    const user = await this.getActivatingOfficer(userId);

    if (newPassword.trim().length < ACTIVATION_PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(
        `Password must be at least ${ACTIVATION_PASSWORD_MIN_LENGTH} characters`,
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.userRepo.update(
      { id: user.id },
      {
        password_hash: passwordHash,
        temp_password_hash: null,
        temp_password_expires_at: null,
        must_change_password: false,
      },
    );

    await this.sendActivationOtp(challengeToken, user.email);

    return {
      message: 'Password updated. OTP sent to your email.',
      otpSent: true,
    };
  }

  async verifyPoliceActivationOtp(challengeToken: string, otp: string) {
    const userId = await this.resolveChallengeToken(challengeToken);
    const user = await this.getActivatingOfficer(userId);

    const verifyKey = policeActivationOtpVerifyKey(challengeToken);
    const attemptCount = await this.redisService.incr(
      verifyKey,
      POLICE_ACTIVATION_OTP_TTL_SECONDS,
    );

    if (attemptCount > POLICE_ACTIVATION_MAX_OTP_VERIFY_ATTEMPTS) {
      throw new HttpException(
        'Too many verification attempts. Please log in again to restart activation.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const otpKey = policeActivationOtpKey(challengeToken);
    const hashedOtp = await this.redisService.get(otpKey);

    if (!hashedOtp) {
      throw new BadRequestException('OTP expired or invalid');
    }

    const isValid = await bcrypt.compare(otp.trim(), hashedOtp);
    if (!isValid) {
      throw new BadRequestException('OTP expired or invalid');
    }

    const link = await this.findOfficerStationLink(user.id);
    const stationId =
      link?.status === PoliceStationLinkStatus.APPROVED
        ? link.station_id
        : null;

    await this.userRepo.update(
      { id: user.id },
      {
        police_account_status: PoliceAccountStatus.ACTIVE,
        is_active: true,
        station_id: stationId,
      },
    );

    await this.redisService.del(policeActivationChallengeKey(challengeToken));
    await this.redisService.del(otpKey);
    await this.redisService.del(verifyKey);

    return {
      message:
        'Account activated successfully. You can now log in with your new password.',
    };
  }

  private async sendActivationOtp(challengeToken: string, email: string) {
    const sendCount = await this.redisService.incr(
      `police:activation:otp:sends:${challengeToken}`,
      3600,
    );

    if (sendCount > POLICE_ACTIVATION_MAX_OTP_SENDS_PER_HOUR) {
      throw new HttpException(
        'Too many OTP requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const otp = randomInt(100000, 999999).toString();
    const hashOtp = await bcrypt.hash(otp, 12);

    await this.redisService.set(
      policeActivationOtpKey(challengeToken),
      hashOtp,
      POLICE_ACTIVATION_OTP_TTL_SECONDS,
    );
    await this.redisService.del(policeActivationOtpVerifyKey(challengeToken));

    await this.otpEmailService.sendPasswordResetOtp(email, otp);
  }

  private async resolveChallengeToken(challengeToken: string): Promise<string> {
    const key = policeActivationChallengeKey(challengeToken);
    const userId = await this.redisService.get(key);

    if (!userId) {
      throw new BadRequestException('Activation session expired or invalid');
    }

    return userId;
  }

  private async getActivatingOfficer(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId, role: Role.POLICE },
    });

    if (!user) {
      throw new BadRequestException('Activation session expired or invalid');
    }

    if (user.police_account_status === PoliceAccountStatus.SUSPENDED) {
      throw new BadRequestException('This account is suspended');
    }

    return user;
  }

  private async findOfficerStationLink(
    officerId: string,
  ): Promise<PoliceStationLink | null> {
    return this.linkRepo.findOne({
      where: { officer_id: officerId },
      order: { created_at: 'DESC' },
    });
  }

  private throwPoliceLoginBlocked(
    code: (typeof POLICE_LOGIN_BLOCKED_REASON)[keyof typeof POLICE_LOGIN_BLOCKED_REASON],
    message: string,
  ): never {
    throw new UnauthorizedException({ message, code });
  }

  private async assertSuperAdmin(userId: string): Promise<void> {
    const user = await this.userRepo.findOneBy({ id: userId });

    if (!user || user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only super administrators can perform this action',
      );
    }
  }

  private enforceResendLimits(officer: User): void {
    const now = Date.now();

    if (officer.temp_password_last_resend_at) {
      const cooldownMs = TEMP_PASSWORD_RESEND_COOLDOWN_MINUTES * 60 * 1000;
      const elapsed = now - officer.temp_password_last_resend_at.getTime();

      if (elapsed < cooldownMs) {
        const minutesLeft = Math.ceil((cooldownMs - elapsed) / 60000);
        throw new HttpException(
          `Please wait ${minutesLeft} minute(s) before resending the temporary password`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);

    if (
      officer.temp_password_last_resend_at &&
      officer.temp_password_last_resend_at >= dayStart &&
      officer.temp_password_resend_count >=
        TEMP_PASSWORD_MAX_RESEND_ATTEMPTS_PER_DAY
    ) {
      throw new HttpException(
        'Daily temporary password resend limit reached',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async sendProvisioningEmail(
    email: string,
    fullName: string,
    tempPassword: string,
    expiryHours: number,
  ): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3002';
    const loginUrl = `${frontendUrl}/login`;

    await this.notificationService.sendEmail({
      to: email,
      subject: 'Your Surakshya Officer Account — Login Details',
      text: `Hello ${fullName},\n\nYour Surakshya Police Portal account has been created.\n\nLogin email: ${email}\nTemporary password: ${tempPassword}\n\nLog in at: ${loginUrl}\n\nThis temporary password expires in ${expiryHours} hours. Your station assignment is pending Super Admin approval — you will not be able to log in until it is approved.\n\nSurakshya Team`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Police Portal Account Created</h2>
          <p>Hello ${fullName},</p>
          <p>Your <strong>Surakshya Police Portal</strong> account has been created.</p>
          <p><strong>Login email:</strong> ${email}</p>
          <p><strong>Temporary password:</strong> ${tempPassword}</p>
          <p><a href="${loginUrl}">Log in to Surakshya</a></p>
          <p>This temporary password expires in ${expiryHours} hours.</p>
          <p>Your station assignment is pending Super Admin approval. You will not be able to log in until it is approved.</p>
          <p>Surakshya Team</p>
        </div>
      `,
    });
  }

  private generateTempPassword(): string {
    const length = Number(
      this.configService.get<string>('POLICE_TEMP_PASSWORD_LENGTH') ??
        TEMP_PASSWORD_LENGTH,
    );
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const symbols = '!@#$%&*';
    const all = upper + lower + digits + symbols;

    const chars: string[] = [
      upper[randomBytes(1)[0] % upper.length],
      lower[randomBytes(1)[0] % lower.length],
      digits[randomBytes(1)[0] % digits.length],
      symbols[randomBytes(1)[0] % symbols.length],
    ];

    while (chars.length < length) {
      chars.push(all[randomBytes(1)[0] % all.length]);
    }

    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomBytes(1)[0] % (i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
  }

  private normalizePhone(phone: string): string {
    const trimmed = phone.trim().replace(/^\+977/, '');
    return trimmed.replace(/[\s-]/g, '');
  }
}
