import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { NotificationService } from 'src/feature/notification/notification.service';
import { PoliceStation } from 'src/feature/police-stations/entities/police-station.entity';
import { TrackingGateway } from 'src/feature/tracking/tracking.gateway';
import { User } from 'src/feature/user/entities/user.entity';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';

@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(PoliceStation)
    private readonly stationRepo: Repository<PoliceStation>,
    private readonly trackingGateway: TrackingGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async broadcast(dto: CreateBroadcastDto) {
    const priority = dto.priority ?? 'normal';
    let station: PoliceStation | null = null;

    if (dto.station_id) {
      station = await this.stationRepo.findOne({
        where: { id: dto.station_id },
      });
      if (!station) {
        throw new NotFoundException('Police station not found');
      }
    }

    const qb = this.userRepo
      .createQueryBuilder('user')
      .where('user.role = :role', { role: Role.POLICE });

    if (dto.station_id) {
      qb.andWhere('user.station_id = :stationId', {
        stationId: dto.station_id,
      });
    }

    const officers = await qb.getMany();
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    this.trackingGateway.emitAdminBroadcast({
      id,
      message: dto.message,
      priority,
      stationId: dto.station_id ?? null,
      createdAt,
    });

    let emailsQueued = 0;
    if (dto.send_email || priority === 'high') {
      for (const officer of officers) {
        if (!officer.email) continue;
        try {
          await this.notificationService.sendEmail({
            to: officer.email,
            subject: `[Surakshya] ${priority === 'high' ? 'Urgent' : 'Admin'} broadcast`,
            text: dto.message,
            html: `<p>${dto.message.replace(/</g, '&lt;')}</p>`,
          });
          emailsQueued += 1;
        } catch (error) {
          this.logger.warn(
            `Broadcast email failed for ${officer.email}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    }

    return {
      id,
      message: dto.message,
      priority,
      station_id: dto.station_id ?? null,
      recipients: officers.length,
      emails_queued: emailsQueued,
      delivered_via: ['socket', ...(emailsQueued > 0 ? ['email'] : [])],
      created_at: createdAt,
    };
  }
}
