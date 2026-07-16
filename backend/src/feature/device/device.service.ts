import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Device } from './entities/device.entity';

/** Connected only while IoT has recently signaled (heartbeat ~30s). */
const DEVICE_ONLINE_THRESHOLD_MS = 90 * 1000;

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<Device> {
    const device = this.deviceRepository.create(createDeviceDto);
    return this.deviceRepository.save(device);
  }

  async findAll(): Promise<Device[]> {
    return this.deviceRepository.find();
  }

  async findOne(id: string): Promise<Device> {
    const device = await this.deviceRepository.findOneBy({ id });
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  /**
   * Linked wearable for a citizen (skips phone-* virtual devices).
   * Connected = IoT recently signaled the backend; otherwise disconnected.
   */
  async getStatusForUser(userId: string): Promise<{
    linked: boolean;
    id: string | null;
    imei: string | null;
    label: string | null;
    isOnline: boolean;
    lastSeenAt: string | null;
  }> {
    const devices = await this.deviceRepository.find({
      where: {
        user: { id: userId },
        imei: Not(IsNull()),
      },
      order: { lastSeenAt: 'DESC' },
      take: 10,
    });

    const device =
      devices.find((d) => !d.imei.startsWith('phone-')) ?? devices[0] ?? null;

    if (!device) {
      return {
        linked: false,
        id: null,
        imei: null,
        label: null,
        isOnline: false,
        lastSeenAt: null,
      };
    }

    const lastSeenAt = device.lastSeenAt ?? null;
    const ageMs =
      lastSeenAt != null ? Date.now() - lastSeenAt.getTime() : null;
    const isOnline =
      ageMs != null && ageMs <= DEVICE_ONLINE_THRESHOLD_MS;

    return {
      linked: true,
      id: device.id,
      imei: device.imei,
      label: device.label ?? null,
      isOnline,
      lastSeenAt: lastSeenAt?.toISOString() ?? null,
    };
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto): Promise<Device> {
    const device = await this.findOne(id);
    Object.assign(device, updateDeviceDto);
    return this.deviceRepository.save(device);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.deviceRepository.delete({ id });
  }
}
