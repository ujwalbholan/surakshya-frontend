import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { User } from 'src/feature/user/entities/user.entity';
import { GuardianLink } from './entities/guardian-link.entity';
import { GuardianRequest } from './entities/guardian-request.entity';
import { Device } from 'src/feature/device/entities/device.entity';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { LocationPing } from 'src/feature/device/entities/location-ping.entity';

import { CreateGuardianDto } from './dto/create-guardian.dto';
import { AddWardDto } from './dto/add-ward.dto';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { NotificationService } from '../notification/notification.service';
import { RedisService } from 'src/config/redis/redis.service';
import { MqttService } from '../mqtt/mqtt.service';
import {
  GUARDIAN_ACTIVATION_CHALLENGE_TTL_SECONDS,
  GUARDIAN_ACTIVATION_MAX_OTP_SENDS_PER_HOUR,
  GUARDIAN_ACTIVATION_MAX_OTP_VERIFY_ATTEMPTS,
  GUARDIAN_ACTIVATION_OTP_TTL_SECONDS,
  GUARDIAN_ACTIVATION_PASSWORD_MIN_LENGTH,
  GUARDIAN_TEMP_PASSWORD_TTL_HOURS,
  GuardianLoginChallengeResult,
  guardianActivationChallengeKey,
  guardianActivationOtpKey,
  guardianActivationOtpVerifyKey,
} from './guardian-activation.types';

@Injectable()
export class GuardianService {
  private readonly logger = new Logger(GuardianService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(GuardianLink)
    private readonly guardianLinkRepository: Repository<GuardianLink>,
    @InjectRepository(GuardianRequest)
    private readonly guardianRequestRepository: Repository<GuardianRequest>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(SosEvent)
    private readonly sosEventRepository: Repository<SosEvent>,
    @InjectRepository(LocationPing)
    private readonly locationPingRepository: Repository<LocationPing>,
    private readonly notificationService: NotificationService,
    private readonly redisService: RedisService,
    private readonly mqttService: MqttService,
  ) {}

  async addGuardian(childUserId: string, dto: CreateGuardianDto) {
    const child = await this.userRepository.findOneBy({ id: childUserId });

    if (!child || child.role !== Role.USER) {
      throw new BadRequestException('Only users can add guardians');
    }

    const email = dto.email.trim().toLowerCase();
    const phone = this.normalizePhone(dto.phone);

    let guardian = await this.userRepository.findOne({
      where: [{ email }, { phone }],
    });

    if (guardian && guardian.email === email && guardian.phone === phone) {
      throw new BadRequestException(
        'This person is already registered with this email and phone',
      );
    }

    if (guardian) {
      throw new BadRequestException(
        'Email or phone already in use by another account',
      );
    }

    const password = this.generatePassword();
    const passwordHash = await bcrypt.hash(password, 12);
    const expiresAt = new Date(
      Date.now() + GUARDIAN_TEMP_PASSWORD_TTL_HOURS * 60 * 60 * 1000,
    );

    guardian = await this.userRepository.save(
      this.userRepository.create({
        full_name: dto.full_name.trim(),
        email,
        phone,
        password_hash: null as unknown as string,
        role: Role.GUARDIAN,
        is_active: false,
        phone_verified: false,
        must_change_password: true,
        temp_password_hash: passwordHash,
        temp_password_expires_at: expiresAt,
        temp_password_resend_count: 0,
      }),
    );

    const request = await this.guardianRequestRepository.save(
      this.guardianRequestRepository.create({
        requester_id: childUserId,
        requester_name: child.full_name,
        target_email: email,
        target_phone: phone,
        target_name: dto.full_name.trim(),
        direction: 'CHILD_TO_GUARDIAN',
        status: 'PENDING',
      }),
    );

    await this.sendCredentialsEmail(
      email,
      dto.full_name.trim(),
      password,
      child.full_name,
    );

    return {
      message:
        'Guardian request sent. An email with a temporary password has been sent. The guardian must log in, change their password, and verify their phone before accessing the account.',
      request_id: request.id,
      guardian: this.toPublicUser(guardian),
    };
  }

  async addWard(guardianUserId: string, dto: AddWardDto) {
    const guardian = await this.userRepository.findOneBy({
      id: guardianUserId,
    });

    if (!guardian || guardian.role !== Role.GUARDIAN) {
      throw new BadRequestException('Only guardians can add wards');
    }

    const email = dto.child_email.trim().toLowerCase();

    const child = await this.userRepository.findOne({ where: { email } });

    if (!child) {
      throw new BadRequestException('No user found with this email');
    }

    if (child.role !== Role.USER) {
      throw new BadRequestException('This email belongs to a non-user account');
    }

    const existingLink = await this.guardianLinkRepository.findOne({
      where: {
        child_user_id: child.id,
        guardian_user_id: guardianUserId,
      },
    });

    if (existingLink) {
      throw new BadRequestException(
        'This child is already linked to you as a guardian',
      );
    }

    const existingRequest = await this.guardianRequestRepository.findOne({
      where: {
        requester_id: guardianUserId,
        target_email: email,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        'A pending request already exists for this child',
      );
    }

    await this.guardianRequestRepository.save(
      this.guardianRequestRepository.create({
        requester_id: guardianUserId,
        requester_name: guardian.full_name,
        target_email: email,
        target_phone: child.phone,
        target_name: child.full_name,
        direction: 'GUARDIAN_TO_CHILD',
        status: 'PENDING',
      }),
    );

    return {
      message:
        'Guardian request sent to the child. They will see it in their notifications.',
    };
  }

  async getMyRequests(userId: string, role: Role) {
    if (role === Role.GUARDIAN) {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) throw new NotFoundException('User not found');

      const requests = await this.guardianRequestRepository.find({
        where: {
          target_email: this.normalizeEmail(user.email),
          direction: 'CHILD_TO_GUARDIAN',
          status: 'PENDING',
        },
        order: { created_at: 'DESC' },
      });

      return {
        message: 'Pending requests retrieved successfully',
        requests: requests.map((r) => ({
          id: r.id,
          requester_name: r.requester_name,
          requester_id: r.requester_id,
          direction: r.direction,
          status: r.status,
          created_at: r.created_at,
        })),
      };
    }

    if (role === Role.USER) {
      const child = await this.userRepository.findOneBy({ id: userId });
      if (!child) throw new NotFoundException('User not found');

      const requests = await this.guardianRequestRepository.find({
        where: {
          direction: 'GUARDIAN_TO_CHILD',
          target_email: this.normalizeEmail(child.email),
          status: 'PENDING',
        },
        order: { created_at: 'DESC' },
      });

      return {
        message: 'Pending requests retrieved successfully',
        requests: requests.map((r) => ({
          id: r.id,
          target_name: r.target_name,
          target_email: r.target_email,
          direction: r.direction,
          status: r.status,
          created_at: r.created_at,
        })),
      };
    }

    return { requests: [] };
  }

  async acceptRequest(requestId: string, userId: string) {
    const request = await this.guardianRequestRepository.findOneBy({
      id: requestId,
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request has already been processed');
    }

    if (request.direction === 'CHILD_TO_GUARDIAN') {
      const guardian = await this.userRepository.findOneBy({ id: userId });

      if (!guardian || guardian.role !== Role.GUARDIAN) {
        throw new BadRequestException('Only guardians can accept this request');
      }

      if (guardian.email !== request.target_email) {
        throw new BadRequestException('This request is not addressed to you');
      }

      const existingLink = await this.guardianLinkRepository.findOne({
        where: {
          child_user_id: request.requester_id,
          guardian_user_id: userId,
        },
      });

      if (existingLink) {
        request.status = 'ACCEPTED';
        await this.guardianRequestRepository.save(request);
        return { message: 'Already linked as guardian' };
      }

      await this.guardianLinkRepository.save(
        this.guardianLinkRepository.create({
          child_user_id: request.requester_id,
          guardian_user_id: userId,
        }),
      );

      request.status = 'ACCEPTED';
      await this.guardianRequestRepository.save(request);

      return { message: 'Guardian request accepted successfully' };
    }

    if (request.direction === 'GUARDIAN_TO_CHILD') {
      const actingUser = await this.userRepository.findOneBy({ id: userId });

      if (!actingUser || actingUser.role !== Role.USER) {
        throw new BadRequestException('Only users can accept this request');
      }

      if (
        this.normalizeEmail(actingUser.email) !==
        this.normalizeEmail(request.target_email)
      ) {
        throw new BadRequestException('This request is not addressed to you');
      }

      const existingLink = await this.guardianLinkRepository.findOne({
        where: {
          child_user_id: userId,
          guardian_user_id: request.requester_id,
        },
      });

      if (existingLink) {
        request.status = 'ACCEPTED';
        await this.guardianRequestRepository.save(request);
        return { message: 'Already linked as guardian' };
      }

      await this.guardianLinkRepository.save(
        this.guardianLinkRepository.create({
          child_user_id: userId,
          guardian_user_id: request.requester_id,
        }),
      );

      request.status = 'ACCEPTED';
      await this.guardianRequestRepository.save(request);

      return { message: 'Child linked successfully as your ward' };
    }

    throw new BadRequestException('Invalid request direction');
  }

  async rejectRequest(requestId: string, userId: string) {
    const request = await this.guardianRequestRepository.findOneBy({
      id: requestId,
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request has already been processed');
    }

    if (request.direction === 'CHILD_TO_GUARDIAN') {
      const guardian = await this.userRepository.findOneBy({ id: userId });

      if (!guardian || guardian.role !== Role.GUARDIAN) {
        throw new BadRequestException('Only guardians can reject this request');
      }

      if (guardian.email !== request.target_email) {
        throw new BadRequestException('This request is not addressed to you');
      }
    }

    if (request.direction === 'GUARDIAN_TO_CHILD') {
      const child = await this.userRepository.findOneBy({
        email: request.target_email,
      });

      if (!child || child.id !== userId) {
        throw new BadRequestException('This request is not addressed to you');
      }
    }

    request.status = 'REJECTED';
    await this.guardianRequestRepository.save(request);

    return { message: 'Request rejected successfully' };
  }

  /**
   * Login gate for GUARDIAN — mirrors police activation.
   * Returns a challenge payload, or null to continue normal JWT login.
   */
  async evaluateGuardianLogin(
    user: User,
    password: string,
  ): Promise<GuardianLoginChallengeResult | null> {
    if (user.role !== Role.GUARDIAN) {
      return null;
    }

    if (user.must_change_password) {
      if (
        user.temp_password_expires_at &&
        user.temp_password_expires_at < new Date()
      ) {
        throw new UnauthorizedException(
          'Your temporary password has expired. Ask the linked user to invite you again.',
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
        role: 'GUARDIAN',
      };
    }

    if (!user.is_active || !user.phone_verified) {
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
      await this.sendActivationOtp(challengeToken, user);

      return {
        message:
          'Account activation incomplete. Enter the OTP sent to your phone.',
        requiresActivationOtp: true,
        challengeToken,
        role: 'GUARDIAN',
      };
    }

    return null;
  }

  async completeGuardianActivation(challengeToken: string, newPassword: string) {
    const userId = await this.resolveChallengeToken(challengeToken);
    const user = await this.getActivatingGuardian(userId);

    if (newPassword.trim().length < GUARDIAN_ACTIVATION_PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(
        `Password must be at least ${GUARDIAN_ACTIVATION_PASSWORD_MIN_LENGTH} characters`,
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.userRepository.update(
      { id: user.id },
      {
        password_hash: passwordHash,
        temp_password_hash: null,
        temp_password_expires_at: null,
        must_change_password: false,
      },
    );

    await this.sendActivationOtp(challengeToken, user);

    return {
      message: 'Password updated. OTP sent to your registered phone number.',
      otpSent: true,
    };
  }

  async verifyGuardianActivationOtp(challengeToken: string, otp: string) {
    const userId = await this.resolveChallengeToken(challengeToken);
    await this.getActivatingGuardian(userId);

    const verifyKey = guardianActivationOtpVerifyKey(challengeToken);
    const attemptCount = await this.redisService.incr(
      verifyKey,
      GUARDIAN_ACTIVATION_OTP_TTL_SECONDS,
    );

    if (attemptCount > GUARDIAN_ACTIVATION_MAX_OTP_VERIFY_ATTEMPTS) {
      throw new HttpException(
        'Too many verification attempts. Please log in again to restart activation.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const otpKey = guardianActivationOtpKey(challengeToken);
    const hashedOtp = await this.redisService.get(otpKey);

    if (!hashedOtp) {
      throw new BadRequestException('OTP expired or invalid');
    }

    const isValid = await bcrypt.compare(otp.trim(), hashedOtp);
    if (!isValid) {
      throw new BadRequestException('OTP expired or invalid');
    }

    await this.userRepository.update(
      { id: userId },
      {
        phone_verified: true,
        is_active: true,
      },
    );

    await this.redisService.del(guardianActivationChallengeKey(challengeToken));
    await this.redisService.del(otpKey);
    await this.redisService.del(verifyKey);

    return {
      message:
        'Account activated successfully. You can now log in with your new password.',
    };
  }

  private async issueActivationChallenge(userId: string): Promise<string> {
    const challengeToken = randomUUID();
    await this.redisService.set(
      guardianActivationChallengeKey(challengeToken),
      userId,
      GUARDIAN_ACTIVATION_CHALLENGE_TTL_SECONDS,
    );
    return challengeToken;
  }

  private async resolveChallengeToken(challengeToken: string): Promise<string> {
    const key = guardianActivationChallengeKey(challengeToken);
    const userId = await this.redisService.get(key);
    if (!userId) {
      throw new UnauthorizedException(
        'Activation session expired. Please sign in again with your temporary or new password.',
      );
    }
    return userId;
  }

  private async getActivatingGuardian(userId: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user || user.role !== Role.GUARDIAN) {
      throw new UnauthorizedException('Invalid activation session');
    }
    return user;
  }

  private async sendActivationOtp(challengeToken: string, user: User) {
    const sendCount = await this.redisService.incr(
      `guardian:activation:otp:sends:${challengeToken}`,
      3600,
    );

    if (sendCount > GUARDIAN_ACTIVATION_MAX_OTP_SENDS_PER_HOUR) {
      throw new HttpException(
        'Too many OTP requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const otp = randomInt(100000, 999999).toString();
    const hashOtp = await bcrypt.hash(otp, 12);

    await this.redisService.set(
      guardianActivationOtpKey(challengeToken),
      hashOtp,
      GUARDIAN_ACTIVATION_OTP_TTL_SECONDS,
    );
    await this.redisService.del(guardianActivationOtpVerifyKey(challengeToken));

    await this.sendOtpSms(user.phone, user.full_name, otp);
  }

  async sendOtp(email: string) {
    const user = await this.userRepository.findOne({
      where: { email, role: Role.GUARDIAN },
    });

    if (!user) {
      throw new NotFoundException('No guardian found with this email');
    }

    const otp = randomInt(100000, 999999).toString();
    const hashOtp = await bcrypt.hash(otp, 12);

    await this.redisService.set(`guardian:otp:${email}`, hashOtp, 5 * 60);

    await this.sendOtpSms(user.phone, user.full_name, otp);

    return { message: 'OTP sent to your registered phone number' };
  }

  async verifyOtp(email: string, otp: string) {
    const key = `guardian:otp:${email}`;
    const hashedOtp = await this.redisService.get(key);

    if (!hashedOtp) {
      throw new BadRequestException('OTP expired or invalid');
    }

    const isValid = await bcrypt.compare(otp, hashedOtp);

    if (!isValid) {
      throw new BadRequestException('OTP expired or invalid');
    }

    await this.redisService.del(key);

    await this.userRepository.update({ email }, { phone_verified: true });

    return {
      message: 'Phone verified successfully. You can now set your password.',
    };
  }

  async setPassword(email: string, oldPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({
      where: { email, role: Role.GUARDIAN },
    });

    if (!user) {
      throw new NotFoundException('No guardian found with this email');
    }

    if (!user.phone_verified) {
      throw new BadRequestException('Please verify your phone first via OTP');
    }

    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      user.password_hash,
    );

    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(
      { email },
      { password_hash: passwordHash },
    );

    return {
      message:
        'Password set successfully. You can now log in with your new password.',
    };
  }

  async getMyGuardians(
    childUserId: string,
    options: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    const skip = (options.page - 1) * options.limit;
    const [links, total] = await this.guardianLinkRepository.findAndCount({
      where: { child_user_id: childUserId },
      relations: ['guardian'],
      order: { is_emergency_contact: 'DESC', created_at: 'DESC' },
      skip,
      take: options.limit,
    });

    return {
      message: 'Guardians retrieved successfully',
      guardians: links.map((link) => ({
        ...this.toPublicUser(link.guardian),
        is_emergency_contact: Boolean(link.is_emergency_contact),
      })),
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  /**
   * Designate (or clear) one linked guardian as the SOS emergency contact.
   * Only one emergency contact is allowed per child.
   */
  async setEmergencyContact(
    childUserId: string,
    guardianUserId: string,
    isEmergencyContact: boolean,
  ) {
    const link = await this.guardianLinkRepository.findOne({
      where: {
        child_user_id: childUserId,
        guardian_user_id: guardianUserId,
      },
      relations: ['guardian'],
    });

    if (!link) {
      throw new ForbiddenException('You are not linked to this guardian');
    }

    if (isEmergencyContact) {
      await this.guardianLinkRepository.update(
        { child_user_id: childUserId, is_emergency_contact: true },
        { is_emergency_contact: false },
      );
      link.is_emergency_contact = true;
      await this.guardianLinkRepository.save(link);
    } else if (link.is_emergency_contact) {
      link.is_emergency_contact = false;
      await this.guardianLinkRepository.save(link);
    }

    await this.pushEmergencyContactToUserDevices(
      childUserId,
      isEmergencyContact ? link.guardian.phone : null,
    );

    return {
      message: isEmergencyContact
        ? 'Emergency contact updated'
        : 'Emergency contact cleared',
      guardian: {
        ...this.toPublicUser(link.guardian),
        is_emergency_contact: Boolean(link.is_emergency_contact),
      },
    };
  }

  async updateLinkedGuardianPhone(
    childUserId: string,
    guardianUserId: string,
    phoneRaw: string,
  ) {
    const link = await this.guardianLinkRepository.findOne({
      where: {
        child_user_id: childUserId,
        guardian_user_id: guardianUserId,
      },
      relations: ['guardian'],
    });

    if (!link) {
      throw new ForbiddenException('You are not linked to this guardian');
    }

    const phone = this.normalizePhone(phoneRaw);
    if (link.guardian.phone === phone) {
      return {
        message: 'Phone number unchanged',
        guardian: this.toPublicUser(link.guardian),
      };
    }

    const existing = await this.userRepository.findOne({ where: { phone } });
    if (existing && existing.id !== guardianUserId) {
      throw new BadRequestException('Phone number already in use');
    }

    await this.userRepository.update(
      { id: guardianUserId },
      { phone, phone_verified: false },
    );

    const updated = await this.userRepository.findOneByOrFail({
      id: guardianUserId,
    });

    if (link.is_emergency_contact) {
      await this.pushEmergencyContactToUserDevices(childUserId, updated.phone);
    }

    return {
      message: 'Guardian phone updated successfully',
      guardian: this.toPublicUser(updated),
    };
  }

  async getMyWard(
    guardianUserId: string,
    options: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    const skip = (options.page - 1) * options.limit;
    const [links, total] = await this.guardianLinkRepository.findAndCount({
      where: { guardian_user_id: guardianUserId },
      relations: ['child'],
      order: { created_at: 'DESC' },
      skip,
      take: options.limit,
    });

    if (links.length === 0 && total === 0) {
      throw new NotFoundException('No wards linked to this guardian');
    }

    return {
      message: 'Wards retrieved successfully',
      wards: links.map((link) => this.toPublicUser(link.child)),
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async getWardSosEvents(guardianUserId: string, wardId: string) {
    const link = await this.guardianLinkRepository.findOne({
      where: {
        guardian_user_id: guardianUserId,
        child_user_id: wardId,
      },
    });

    if (!link) {
      throw new ForbiddenException('You are not linked to this ward');
    }

    const devices = await this.deviceRepository.find({
      where: { user: { id: wardId } },
    });

    if (devices.length === 0) {
      return {
        message: 'SOS events retrieved successfully',
        wardId,
        data: [],
        total: 0,
      };
    }

    const deviceIds = devices.map((device) => device.id);
    const events = await this.sosEventRepository.find({
      where: {
        device: { id: In(deviceIds) },
        status: 'active',
      },
      relations: ['device', 'assignedStation'],
      order: { startedAt: 'DESC' },
    });

    const enriched = await Promise.all(
      events.map(async (event) => {
        const latestPing = await this.locationPingRepository.findOne({
          where: { device: { id: event.device.id } },
          order: { recordedAt: 'DESC' },
        });

        return {
          id: event.id,
          deviceId: event.device.id,
          imei: event.device.imei,
          label: event.device.label,
          status: event.status,
          eventType: event.eventType ?? null,
          latitude: event.latitude ?? null,
          longitude: event.longitude ?? null,
          triggerNotes: event.triggerNotes ?? null,
          assignedStationId: event.assignedStation?.id ?? null,
          assignedStationName: event.assignedStation?.name ?? null,
          startedAt: event.startedAt,
          resolvedAt: event.resolvedAt ?? null,
          lastLocation: latestPing
            ? {
                latitude: latestPing.latitude,
                longitude: latestPing.longitude,
                recordedAt: latestPing.recordedAt,
              }
            : null,
        };
      }),
    );

    return {
      message: 'SOS events retrieved successfully',
      wardId,
      data: enriched,
      total: enriched.length,
    };
  }

  private async sendCredentialsEmail(
    email: string,
    name: string,
    password: string,
    childName: string,
  ) {
    try {
      await this.notificationService.sendEmail({
        to: email,
        subject: 'You have been added as a Guardian on Surakshya',
        text: `Hello ${name},\n\n${childName} has added you as their guardian on Surakshya.\n\nYour temporary login credentials:\nEmail: ${email}\nTemporary password: ${password}\n\n1. Open the Surakshya app or website and sign in with these credentials.\n2. You will be asked to set a new password.\n3. Verify the OTP sent to your phone.\n4. Sign in again with your new password and accept the link request.\n\nThis temporary password expires in ${GUARDIAN_TEMP_PASSWORD_TTL_HOURS} hours.\n\nThank you,\nSurakshya Team`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>Guardian Invitation</h2>
            <p>Hello ${name},</p>
            <p><strong>${childName}</strong> has added you as their guardian on <strong>Surakshya</strong>.</p>
            <h3>Temporary Login Credentials</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary password:</strong> ${password}</p>
            <ol>
              <li>Sign in with the temporary password</li>
              <li>Choose a new permanent password</li>
              <li>Verify the OTP sent to your phone</li>
              <li>Sign in again and accept the link request</li>
            </ol>
            <p>This temporary password expires in ${GUARDIAN_TEMP_PASSWORD_TTL_HOURS} hours.</p>
            <p>Thank you,<br/>Surakshya Team</p>
          </div>
        `,
      });
    } catch {
      this.logger.error(`Failed to send credentials email to ${email}`);
    }
  }

  private async sendOtpSms(phone: string, name: string, otp?: string) {
    const code = otp || randomInt(100000, 999999).toString();

    if (!otp) {
      const email = await this.userRepository.findOne({
        where: { phone },
        select: ['email'],
      });
      if (email?.email) {
        const hashOtp = await bcrypt.hash(code, 12);
        await this.redisService.set(
          `guardian:otp:${email.email}`,
          hashOtp,
          5 * 60,
        );
      }
    }

    try {
      await this.notificationService.sendSms({
        to: phone,
        message: `Hello ${name}, your Surakshya verification OTP is: ${code}. It expires in 5 minutes.`,
      });
    } catch {
      this.logger.error(`Failed to send OTP SMS to ${phone}`);
    }
  }

  private generatePassword(): string {
    return randomBytes(8).toString('hex');
  }

  /**
   * Re-push the child's current emergency contact to all assigned bands
   * (e.g. after device assignment).
   */
  async syncEmergencyContactToUserDevices(childUserId: string): Promise<void> {
    const link = await this.guardianLinkRepository.findOne({
      where: {
        child_user_id: childUserId,
        is_emergency_contact: true,
      },
      relations: ['guardian'],
    });
    await this.pushEmergencyContactToUserDevices(
      childUserId,
      link?.guardian?.phone ?? null,
    );
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizePhone(phone: string): string {
    const trimmed = phone.trim();
    return trimmed.startsWith('+977') ? trimmed.slice(4) : trimmed;
  }

  /** Format for SIM ATD dialing (+977… for Nepal mobiles). */
  private toDialablePhone(phone: string | null | undefined): string | null {
    if (!phone) return null;
    const digits = phone.trim().replace(/[\s-]/g, '');
    if (!digits) return null;
    if (digits.startsWith('+')) return digits;
    if (digits.startsWith('977') && digits.length >= 12) return `+${digits}`;
    if (/^9[678]\d{8}$/.test(digits)) return `+977${digits}`;
    return digits;
  }

  private async pushEmergencyContactToUserDevices(
    childUserId: string,
    phoneRaw: string | null,
  ): Promise<void> {
    const devices = await this.deviceRepository.find({
      where: { user: { id: childUserId } },
    });
    if (devices.length === 0) {
      this.logger.warn(
        `No devices assigned to user ${childUserId}; emergency contact not pushed to band`,
      );
      return;
    }

    const dialable = this.toDialablePhone(phoneRaw);
    for (const device of devices) {
      this.mqttService.publishEmergencyContactConfig(device.imei, dialable);
    }
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }
}
