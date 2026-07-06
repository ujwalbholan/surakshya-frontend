import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Device } from 'src/feature/device/entities/device.entity';
import { LocationPing } from 'src/feature/device/entities/location-ping.entity';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { NotificationFailure } from 'src/feature/notification/entities/notification-failure.entity';

@Injectable()
export class EmergencyService {
  private readonly logger = new Logger(EmergencyService.name);

  constructor(
    @InjectRepository(SosEvent)
    private readonly sosRepo: Repository<SosEvent>,
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    @InjectRepository(LocationPing)
    private readonly pingRepo: Repository<LocationPing>,
    @InjectRepository(NotificationFailure)
    private readonly failureRepo: Repository<NotificationFailure>,
  ) {}

  async getLiveEmergencies() {
    const events = await this.sosRepo.find({
      where: { status: 'active' },
      relations: ['device', 'device.user'],
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
          eventType: event.eventType,
          status: event.status,
          latitude: event.latitude,
          longitude: event.longitude,
          altitudeM: event.altitudeM,
          startedAt: event.startedAt,
          resolvedAt: event.resolvedAt,
          user: event.device.user
            ? {
                id: event.device.user.id,
                fullName: event.device.user.full_name,
                phone: event.device.user.phone,
              }
            : null,
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

  async getAlerts(period: 'today' | 'week') {
    const now = new Date();
    const start = new Date(now);

    if (period === 'today') {
      start.setHours(0, 0, 0, 0);
    } else {
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    }

    const [total, active, resolved] = await Promise.all([
      this.sosRepo.count({
        where: { startedAt: MoreThanOrEqual(start) },
      }),
      this.sosRepo.count({
        where: { status: 'active', startedAt: MoreThanOrEqual(start) },
      }),
      this.sosRepo.count({
        where: { status: 'resolved', startedAt: MoreThanOrEqual(start) },
      }),
    ]);

    return { period, total, active, resolved };
  }

  async getWorkload() {
    const activeSosCount = await this.sosRepo.count({
      where: { status: 'active' },
    });

    const totalDevices = await this.deviceRepo.count();
    const onlineDevices = await this.deviceRepo.count({
      where: { isOnline: true },
    });

    return {
      activeEmergencies: activeSosCount,
      totalDevices,
      onlineDevices,
      offlineDevices: totalDevices - onlineDevices,
    };
  }

  async getUnresolvedIncidents() {
    const events = await this.sosRepo.find({
      where: { status: 'active' },
      relations: ['device', 'device.user'],
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
          latitude: event.latitude,
          longitude: event.longitude,
          startedAt: event.startedAt,
          user: event.device.user
            ? {
                id: event.device.user.id,
                fullName: event.device.user.full_name,
                phone: event.device.user.phone,
              }
            : null,
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

  async getCasesNeedingAction() {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    const events = await this.sosRepo.find({
      where: { status: 'active', startedAt: MoreThanOrEqual(sixHoursAgo) },
      relations: ['device', 'device.user'],
      order: { startedAt: 'DESC' },
    });

    const enriched = await Promise.all(
      events.map(async (event) => {
        const pingCount = await this.pingRepo.count({
          where: { sosEvent: { id: event.id } },
        });

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
          elapsedMinutes: Math.floor(
            (Date.now() - event.startedAt.getTime()) / 60000,
          ),
          pingCount,
          user: event.device.user
            ? {
                id: event.device.user.id,
                fullName: event.device.user.full_name,
                phone: event.device.user.phone,
              }
            : null,
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

  async getDeviceStatus() {
    const devices = await this.deviceRepo.find({
      relations: ['user'],
      order: { lastSeenAt: 'DESC' },
    });

    const data = devices.map((device) => ({
      id: device.id,
      imei: device.imei,
      label: device.label,
      isOnline: device.isOnline,
      lastSeenAt: device.lastSeenAt,
      user: device.user
        ? {
            id: device.user.id,
            fullName: device.user.full_name,
            phone: device.user.phone,
          }
        : null,
    }));

    return data;
  }

  async getMapView() {
    const devices = await this.deviceRepo.find({
      where: { isOnline: true },
      relations: ['user'],
    });

    const enriched = await Promise.all(
      devices.map(async (device) => {
        const activeSos = await this.sosRepo.findOne({
          where: { device: { id: device.id }, status: 'active' },
        });

        const latestPing = await this.pingRepo.findOne({
          where: { device: { id: device.id } },
          order: { recordedAt: 'DESC' },
        });

        if (!latestPing) return null;

        return {
          deviceId: device.id,
          imei: device.imei,
          label: device.label,
          latitude: latestPing.latitude,
          longitude: latestPing.longitude,
          altitudeM: latestPing.altitudeM,
          speedKmph: latestPing.speedKmph,
          recordedAt: latestPing.recordedAt,
          hasActiveSos: !!activeSos,
          sosEventId: activeSos?.id ?? null,
          user: device.user
            ? {
                id: device.user.id,
                fullName: device.user.full_name,
                phone: device.user.phone,
              }
            : null,
        };
      }),
    );

    const data = enriched.filter(Boolean);
    return { data, total: data.length };
  }

  async getNotificationFailures(
    page: number,
    limit: number,
    type?: 'sms' | 'email',
  ) {
    const query = this.failureRepo.createQueryBuilder('f');

    if (type) {
      query.andWhere('f.type = :type', { type });
    }

    const skip = (page - 1) * limit;
    const [data, total] = await query
      .skip(skip)
      .take(limit)
      .orderBy('f.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDashboardSummary() {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const [
      activeSosCount,
      sosToday,
      sosThisWeek,
      resolvedToday,
      totalDevices,
      onlineDevices,
      failuresToday,
    ] = await Promise.all([
      this.sosRepo.count({ where: { status: 'active' } }),
      this.sosRepo.count({
        where: { startedAt: MoreThanOrEqual(todayStart) },
      }),
      this.sosRepo.count({
        where: { startedAt: MoreThanOrEqual(weekStart) },
      }),
      this.sosRepo.count({
        where: {
          status: 'resolved',
          resolvedAt: MoreThanOrEqual(todayStart),
        },
      }),
      this.deviceRepo.count(),
      this.deviceRepo.count({ where: { isOnline: true } }),
      this.failureRepo.count({
        where: { createdAt: MoreThanOrEqual(todayStart) },
      }),
    ]);

    return {
      liveEmergencies: activeSosCount,
      alertsToday: sosToday,
      alertsThisWeek: sosThisWeek,
      resolvedToday,
      totalDevices,
      onlineDevices,
      offlineDevices: totalDevices - onlineDevices,
      notificationFailuresToday: failuresToday,
    };
  }
}
