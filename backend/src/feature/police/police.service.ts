import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { safeUser } from 'src/utils/safe-user';
import { User } from 'src/feature/user/entities/user.entity';
import { Device } from 'src/feature/device/entities/device.entity';
import { LocationPing } from 'src/feature/device/entities/location-ping.entity';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { GuardianLink } from 'src/feature/guardian/entities/guardian-link.entity';

@Injectable()
export class PoliceService {
  constructor(
    @InjectRepository(SosEvent)
    private readonly sosRepo: Repository<SosEvent>,
    @InjectRepository(LocationPing)
    private readonly pingRepo: Repository<LocationPing>,
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(GuardianLink)
    private readonly guardianLinkRepo: Repository<GuardianLink>,
  ) {}

  async getDashboard() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      activeSosEvents,
      totalDevices,
      totalUsers,
      sosEventsToday,
      pingsToday,
      resolvedToday,
    ] = await Promise.all([
      this.sosRepo.count({ where: { status: 'active' } }),
      this.deviceRepo.count(),
      this.userRepo.count(),
      this.sosRepo.count({ where: { startedAt: MoreThan(todayStart) } }),
      this.pingRepo.count({ where: { recordedAt: MoreThan(todayStart) } }),
      this.sosRepo.find({
        where: { status: 'resolved', resolvedAt: MoreThan(todayStart) },
        relations: ['device'],
        order: { resolvedAt: 'DESC' },
        take: 10,
      }),
    ]);

    return {
      activeSosEvents,
      totalDevices,
      totalUsers,
      sosEventsToday,
      pingsToday,
      resolvedToday: resolvedToday.map((e) => ({
        id: e.id,
        deviceImei: e.device.imei,
        startedAt: e.startedAt,
        resolvedAt: e.resolvedAt,
      })),
    };
  }

  async getActiveSosEvents() {
    const events = await this.sosRepo.find({
      where: { status: 'active' },
      relations: ['device'],
      order: { startedAt: 'DESC' },
    });

    const enriched = await Promise.all(
      events.map(async (event) => {
        const latestPing = await this.pingRepo.findOne({
          where: { device: { id: event.device.id } },
          order: { recordedAt: 'DESC' },
        });

        return {
          id: event.id,
          deviceId: event.device.id,
          imei: event.device.imei,
          label: event.device.label,
          status: event.status,
          startedAt: event.startedAt,
          resolvedAt: event.resolvedAt,
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

    return { data: enriched, total: enriched.length };
  }

  async getSosEventDetails(id: string) {
    const event = await this.sosRepo.findOne({
      where: { id },
      relations: ['device'],
    });

    if (!event) throw new NotFoundException('SOS event not found');

    const locationPings = await this.pingRepo.find({
      where: { sosEvent: { id } },
      order: { recordedAt: 'DESC' },
      take: 100,
    });

    return { ...event, locationPings };
  }

  async resolveSosEvent(id: string) {
    const event = await this.sosRepo.findOneBy({ id });
    if (!event) throw new NotFoundException('SOS event not found');

    event.status = 'resolved';
    event.resolvedAt = new Date();
    return this.sosRepo.save(event);
  }

  async getDeviceLatestLocation(deviceId: string) {
    const device = await this.deviceRepo.findOneBy({ id: deviceId });
    if (!device) throw new NotFoundException('Device not found');

    const latestPing = await this.pingRepo.findOne({
      where: { device: { id: deviceId } },
      order: { recordedAt: 'DESC' },
    });

    if (!latestPing) {
      return {
        device: { id: device.id, imei: device.imei, label: device.label },
        lastLocation: null,
      };
    }

    return {
      device: { id: device.id, imei: device.imei, label: device.label },
      lastLocation: {
        id: latestPing.id,
        latitude: latestPing.latitude,
        longitude: latestPing.longitude,
        altitudeM: latestPing.altitudeM,
        speedKmph: latestPing.speedKmph,
        satellites: latestPing.satellites,
        recordedAt: latestPing.recordedAt,
      },
    };
  }

  async getUserInfo(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    return safeUser(user);
  }

  async getUserGuardians(userId: string) {
    const links = await this.guardianLinkRepo.find({
      where: { child_user_id: userId },
      relations: ['guardian'],
    });

    return {
      guardians: links.map((link) => ({
        id: link.guardian.id,
        full_name: link.guardian.full_name,
        email: link.guardian.email,
        phone: link.guardian.phone,
        role: link.guardian.role,
        created_at: link.created_at,
      })),
    };
  }
}
