import {
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
import { TrackingGateway } from 'src/feature/tracking/tracking.gateway';

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
    private readonly trackingGateway: TrackingGateway,
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
      relations: ['device', 'device.user', 'assignedStation'],
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
          userId: event.device.user?.id ?? null,
          imei: event.device.imei,
          label: event.device.label,
          status: event.status,
          eventType: event.eventType,
          latitude: event.latitude,
          longitude: event.longitude,
          triggerNotes: event.triggerNotes ?? null,
          assignedStationId: event.assignedStation?.id ?? null,
          assignedStationName: event.assignedStation?.name ?? null,
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
      relations: ['device', 'device.user'],
    });

    if (!event) throw new NotFoundException('SOS event not found');

    const locationPings = await this.pingRepo.find({
      where: { sosEvent: { id } },
      order: { recordedAt: 'DESC' },
      take: 100,
    });

    return { ...event, locationPings };
  }

  async resolveSosEvent(id: string, notes?: string) {
    const existing = await this.sosRepo.findOne({
      where: { id },
      relations: ['device', 'assignedStation'],
    });
    if (!existing) throw new NotFoundException('SOS event not found');

    const resolvedAt = new Date();
    const updatePayload: Partial<SosEvent> = {
      status: 'resolved',
      resolvedAt,
    };
    if (notes !== undefined) {
      updatePayload.notes = notes.trim() || null;
    }

    const result = await this.sosRepo.update(
      { id, status: 'active' },
      updatePayload,
    );

    if (!result.affected) {
      const current = await this.sosRepo.findOne({ where: { id } });
      if (!current) throw new NotFoundException('SOS event not found');
      throw new ConflictException('SOS event already resolved');
    }

    const saved = await this.sosRepo.findOne({
      where: { id },
      relations: ['device', 'device.user', 'assignedStation'],
    });
    if (!saved) throw new NotFoundException('SOS event not found');

    this.trackingGateway.emitSosEvent({
      id: saved.id,
      deviceId: saved.device.imei,
      deviceImei: saved.device.imei,
      userId: saved.device.user?.id ?? null,
      label: saved.device.label ?? null,
      citizenName: saved.device.user?.full_name ?? null,
      eventType: 'sos_resolved',
      status: 'resolved',
      latitude: saved.latitude ?? undefined,
      longitude: saved.longitude ?? undefined,
      altitudeM: saved.altitudeM ?? undefined,
      speedKmph: saved.speedKmph ?? undefined,
      satellites: saved.satellites ?? undefined,
      triggerNotes: saved.triggerNotes ?? undefined,
      assignedStationId: saved.assignedStation?.id,
      assignedStationName: saved.assignedStation?.name,
      startedAt: saved.startedAt.toISOString(),
      resolvedAt: saved.resolvedAt?.toISOString(),
      latestPing: null,
    });

    return saved;
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
      order: { is_emergency_contact: 'DESC', created_at: 'DESC' },
    });

    return {
      guardians: links.map((link) => ({
        id: link.guardian.id,
        full_name: link.guardian.full_name,
        email: link.guardian.email,
        phone: link.guardian.phone,
        role: link.guardian.role,
        is_emergency_contact: Boolean(link.is_emergency_contact),
        created_at: link.created_at,
      })),
    };
  }
}
