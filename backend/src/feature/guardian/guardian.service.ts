import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt } from 'node:crypto';
import { User } from 'src/feature/user/entities/user.entity';
import { GuardianLink } from './entities/guardian-link.entity';
import { GuardianRequest } from './entities/guardian-request.entity';

import { CreateGuardianDto } from './dto/create-guardian.dto';
import { AddWardDto } from './dto/add-ward.dto';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { NotificationService } from '../notification/notification.service';
import { RedisService } from 'src/config/redis/redis.service';

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
    private readonly notificationService: NotificationService,
    private readonly redisService: RedisService,
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

    guardian = await this.userRepository.save(
      this.userRepository.create({
        full_name: dto.full_name.trim(),
        email,
        phone,
        password_hash: passwordHash,
        role: Role.GUARDIAN,
        is_active: true,
        phone_verified: false,
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

    await this.sendOtpSms(phone, dto.full_name.trim());

    return {
      message:
        'Guardian request sent. An email with login credentials and an SMS OTP have been sent to the guardian.',
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
          target_email: user.email,
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
      const requests = await this.guardianRequestRepository.find({
        where: {
          requester_id: userId,
          direction: 'GUARDIAN_TO_CHILD',
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

      if (!guardian.phone_verified) {
        throw new BadRequestException(
          'Please verify your phone number first via OTP before accepting requests',
        );
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
      if (request.requester_id !== userId) {
        throw new BadRequestException(
          'You can only respond to requests made by you',
        );
      }

      const child = await this.userRepository.findOneBy({
        email: request.target_email,
      });

      if (!child) {
        throw new NotFoundException('Target child user not found');
      }

      const existingLink = await this.guardianLinkRepository.findOne({
        where: {
          child_user_id: child.id,
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
          child_user_id: child.id,
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
      order: { created_at: 'DESC' },
      skip,
      take: options.limit,
    });

    return {
      message: 'Guardians retrieved successfully',
      guardians: links.map((link) => this.toPublicUser(link.guardian)),
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
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
        text: `Hello ${name},\n\n${childName} has added you as their guardian on Surakshya.\n\nYour login credentials:\nEmail: ${email}\nPassword: ${password}\n\nPlease log in and verify your phone via OTP to complete the setup.\n\nThank you,\nSurakshya Team`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>Guardian Invitation</h2>
            <p>Hello ${name},</p>
            <p><strong>${childName}</strong> has added you as their guardian on <strong>Surakshya</strong>.</p>
            <h3>Your Login Credentials</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p>An OTP has been sent to your phone. Please use it to verify your account and set a new password.</p>
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

  private normalizePhone(phone: string): string {
    const trimmed = phone.trim();
    return trimmed.startsWith('+977') ? trimmed.slice(4) : trimmed;
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
