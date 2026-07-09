import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  BadGatewayException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, MoreThan, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { PoliceInvite } from './entities/police-invite.entity';
import { PoliceStation } from 'src/feature/police-stations/entities/police-station.entity';
import { User } from 'src/feature/user/entities/user.entity';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { InvitePoliceOfficerDto } from './dto/invite-police-officer.dto';
import { NotificationService } from 'src/feature/notification/notification.service';

@Injectable()
export class PoliceInvitesService {
  private readonly logger = new Logger(PoliceInvitesService.name);

  constructor(
    @InjectRepository(PoliceInvite)
    private readonly inviteRepo: Repository<PoliceInvite>,
    @InjectRepository(PoliceStation)
    private readonly stationRepo: Repository<PoliceStation>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  async invite(dto: InvitePoliceOfficerDto, invitedById: string) {
    const station = await this.stationRepo.findOneBy({ id: dto.station_id });
    if (!station) {
      throw new NotFoundException('Police station not found');
    }

    const email = dto.email.trim().toLowerCase();
    const phone = this.normalizePhone(dto.phone);

    const activeInvite = await this.inviteRepo.findOne({
      where: {
        email,
        used_at: IsNull(),
        expires_at: MoreThan(new Date()),
      },
    });
    if (activeInvite) {
      throw new ConflictException(
        'An active invite already exists for this email',
      );
    }

    const existingUser = await this.userRepo.findOne({
      where: [{ email }, { phone }],
    });
    if (existingUser) {
      throw new ConflictException(
        'A user with this email or phone already exists',
      );
    }

    const tempPassword = this.generateTempPassword();
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const tempPasswordHash = await bcrypt.hash(tempPassword, 12);

    const ttlHours = Number(
      this.configService.get<string>('POLICE_INVITE_TTL_HOURS') ?? 72,
    );
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.save(
        queryRunner.manager.create(User, {
          full_name: dto.full_name.trim(),
          email,
          phone,
          password_hash: tempPasswordHash,
          role: Role.POLICE,
          is_active: false,
          phone_verified: false,
          station_id: dto.station_id,
        }),
      );

      await queryRunner.manager.save(
        queryRunner.manager.create(PoliceInvite, {
          email,
          full_name: dto.full_name.trim(),
          phone,
          station_id: dto.station_id,
          token_hash: tokenHash,
          temp_password_hash: tempPasswordHash,
          invited_by: invitedById,
          expires_at: expiresAt,
        }),
      );

      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ??
        'http://localhost:3002';
      const setupLink = `${frontendUrl}/police/setup?token=${rawToken}`;

      await this.notificationService.sendEmail({
        to: email,
        subject: "You've been invited to Surakshya Police Portal",
        text: `Hello ${dto.full_name.trim()},\n\nYou have been invited to join the Surakshya Police Portal.\n\nSetup link: ${setupLink}\nTemporary password: ${tempPassword}\n\nThis link expires in ${ttlHours} hours. You must set a new password and verify your phone via OTP to activate your account.\n\nSurakshya Team`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>Police Portal Invitation</h2>
            <p>Hello ${dto.full_name.trim()},</p>
            <p>You have been invited to join the <strong>Surakshya Police Portal</strong>.</p>
            <p><a href="${setupLink}">Complete your account setup</a></p>
            <p><strong>Temporary password:</strong> ${tempPassword}</p>
            <p>This link expires in ${ttlHours} hours. You must set a new password and verify your phone via OTP to activate your account.</p>
            <p>Surakshya Team</p>
          </div>
        `,
      });

      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(
          `[Police invite] Officer: ${email} | Setup: ${setupLink} | Temp password: ${tempPassword}`,
        );
      }

      await queryRunner.commitTransaction();

      return {
        message: 'Police officer invite sent successfully',
        email,
        user_id: user.id,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Failed to send police invite to ${email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new BadGatewayException(
        'Failed to send invite email. No account was created.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  private generateTempPassword(): string {
    const length = Number(
      this.configService.get<string>('POLICE_TEMP_PASSWORD_LENGTH') ?? 14,
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

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private normalizePhone(phone: string): string {
    const trimmed = phone.trim().replace(/^\+977/, '');
    return trimmed.replace(/[\s-]/g, '');
  }
}
