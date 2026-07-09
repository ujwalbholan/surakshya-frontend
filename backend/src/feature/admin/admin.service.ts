import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { safeUser } from 'src/utils/safe-user';
import { User } from 'src/feature/user/entities/user.entity';
import { Device } from 'src/feature/device/entities/device.entity';
import { LocationPing } from 'src/feature/device/entities/location-ping.entity';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { GuardianLink } from 'src/feature/guardian/entities/guardian-link.entity';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreateAdminDeviceDto } from './dto/create-admin-device.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    @InjectRepository(LocationPing)
    private readonly pingRepo: Repository<LocationPing>,
    @InjectRepository(SosEvent)
    private readonly sosRepo: Repository<SosEvent>,
    @InjectRepository(GuardianLink)
    private readonly guardianLinkRepo: Repository<GuardianLink>,
  ) {}

  async getStats() {
    const [totalUsers, totalDevices, totalPings, activeSosEvents] =
      await Promise.all([
        this.userRepo.count(),
        this.deviceRepo.count(),
        this.pingRepo.count(),
        this.sosRepo.count({ where: { status: 'active' } }),
      ]);

    const usersByRole = await this.userRepo
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [newUsersToday, pingsToday, resolvedSosToday] = await Promise.all([
      this.userRepo.count({ where: { created_at: MoreThan(todayStart) } }),
      this.pingRepo.count({ where: { recordedAt: MoreThan(todayStart) } }),
      this.sosRepo.count({
        where: {
          status: 'resolved',
          resolvedAt: MoreThan(todayStart),
        },
      }),
    ]);

    return {
      totalUsers,
      totalDevices,
      totalPings,
      activeSosEvents,
      usersByRole: usersByRole.map((r: { role: string; count: string }) => ({
        role: r.role,
        count: Number(r.count),
      })),
      newUsersToday,
      pingsToday,
      resolvedSosToday,
    };
  }

  async getUsers(options: {
    excludeUserId?: string;
    role?: string;
    is_active?: boolean;
    search?: string;
    page: number;
    limit: number;
  }) {
    const query = this.userRepo.createQueryBuilder('user');

    if (options.excludeUserId) {
      query.andWhere('user.id != :excludeUserId', {
        excludeUserId: options.excludeUserId,
      });
    }

    if (options.role) {
      query.andWhere('user.role = :role', { role: options.role });
    }

    if (options.is_active !== undefined) {
      query.andWhere('user.is_active = :is_active', {
        is_active: options.is_active,
      });
    }

    if (options.search) {
      query.andWhere(
        '(user.full_name ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    const skip = (options.page - 1) * options.limit;
    const [users, total] = await query
      .skip(skip)
      .take(options.limit)
      .orderBy('user.created_at', 'DESC')
      .getManyAndCount();

    return {
      data: users.map((user) => safeUser(user)),
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async getUserDetails(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: [],
    });

    if (!user) throw new NotFoundException('User not found');

    const guardianLinks = await this.guardianLinkRepo.find({
      where: [{ child_user_id: id }, { guardian_user_id: id }],
      relations: ['child', 'guardian'],
    });

    const publicUser = safeUser(user);

    return {
      ...publicUser,
      guardianLinks: guardianLinks.map((link) => ({
        id: link.id,
        child: {
          id: link.child.id,
          full_name: link.child.full_name,
          email: link.child.email,
          phone: link.child.phone,
          role: link.child.role,
        },
        guardian: {
          id: link.guardian.id,
          full_name: link.guardian.full_name,
          email: link.guardian.email,
          phone: link.guardian.phone,
          role: link.guardian.role,
        },
        created_at: link.created_at,
      })),
    };
  }

  async updateUserStatus(id: string, dto: UpdateUserStatusDto) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');

    user.is_active = dto.is_active;
    await this.userRepo.save(user);
    return safeUser(user);
  }

  async updateUserRole(id: string, dto: UpdateUserRoleDto) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');

    user.role = dto.role;
    await this.userRepo.save(user);
    return safeUser(user);
  }

  async getDevices(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [devices, total] = await this.deviceRepo.findAndCount({
      skip,
      take: limit,
      order: { id: 'DESC' },
      relations: ['user'],
    });

    return {
      data: devices.map((device) => this.formatDevice(device)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createDevice(dto: CreateAdminDeviceDto) {
    const imei = dto.imei.trim();
    const existing = await this.deviceRepo.findOne({ where: { imei } });
    if (existing) {
      throw new ConflictException(
        `Device with band ID "${imei}" already exists`,
      );
    }

    const device = this.deviceRepo.create({
      imei,
      label: dto.label?.trim() || imei,
    });
    const saved = await this.deviceRepo.save(device);
    return this.formatDevice(saved);
  }

  async assignDevice(deviceId: string, userId: string) {
    const device = await this.deviceRepo.findOne({
      where: { id: deviceId },
      relations: ['user'],
    });
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== Role.USER) {
      throw new BadRequestException(
        'Only citizen accounts (USER role) can be assigned a band',
      );
    }

    if (device.user && device.user.id !== userId) {
      throw new ConflictException(
        `Device is already assigned to ${device.user.full_name}. Unassign first or choose another band.`,
      );
    }

    device.user = user;
    const saved = await this.deviceRepo.save(device);
    return this.formatDevice(saved);
  }

  async unassignDevice(deviceId: string) {
    const device = await this.deviceRepo.findOne({
      where: { id: deviceId },
      relations: ['user'],
    });
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    device.user = null;
    const saved = await this.deviceRepo.save(device);
    return this.formatDevice(saved);
  }

  private formatDevice(device: Device) {
    return {
      id: device.id,
      imei: device.imei,
      label: device.label,
      isOnline: device.isOnline,
      lastSeenAt: device.lastSeenAt,
      user: device.user
        ? {
            id: device.user.id,
            full_name: device.user.full_name,
            email: device.user.email,
            phone: device.user.phone,
            role: device.user.role,
          }
        : null,
    };
  }

  async getSosEvents(options: {
    status?: 'active' | 'resolved';
    page: number;
    limit: number;
  }) {
    const query = this.sosRepo
      .createQueryBuilder('sos')
      .leftJoinAndSelect('sos.device', 'device');

    if (options.status) {
      query.andWhere('sos.status = :status', { status: options.status });
    }

    const skip = (options.page - 1) * options.limit;
    const [data, total] = await query
      .skip(skip)
      .take(options.limit)
      .orderBy('sos.startedAt', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async getSosEventDetails(id: string) {
    const sos = await this.sosRepo.findOne({
      where: { id },
      relations: ['device'],
    });

    if (!sos) throw new NotFoundException('SOS event not found');

    const locationPings = await this.pingRepo.find({
      where: { sosEvent: { id } },
      order: { recordedAt: 'DESC' },
      take: 100,
    });

    return { ...sos, locationPings };
  }

  async resolveSosEvent(id: string) {
    const sos = await this.sosRepo.findOneBy({ id });
    if (!sos) throw new NotFoundException('SOS event not found');

    const result = await this.sosRepo.update(
      { id, status: 'active' },
      { status: 'resolved', resolvedAt: new Date() },
    );

    if (!result.affected) {
      throw new ConflictException('SOS event already resolved');
    }

    return this.sosRepo.findOneBy({ id });
  }
}
