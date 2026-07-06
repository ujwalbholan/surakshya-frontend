import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable, tap } from 'rxjs';
import type { Request } from 'express';
import {
  LOG_LOCATION_ACCESS_KEY,
  LogLocationAccessOptions,
} from './decorators/log-location-access.decorator';
import { LocationAccessLog } from './entities/location-access-log.entity';

interface AuthenticatedUser {
  userId: string;
  role: string;
}

@Injectable()
export class LocationAccessAuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(LocationAccessLog)
    private readonly accessLogRepo: Repository<LocationAccessLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.reflector.get<LogLocationAccessOptions | undefined>(
      LOG_LOCATION_ACCESS_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user?.userId) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((body: unknown) => {
        void this.persistAccessLog(metadata, request, user, body);
      }),
    );
  }

  private async persistAccessLog(
    metadata: LogLocationAccessOptions,
    request: Request,
    user: AuthenticatedUser,
    body: unknown,
  ): Promise<void> {
    const entries = this.buildEntries(metadata, request, body);

    for (const entry of entries) {
      await this.accessLogRepo.save(
        this.accessLogRepo.create({
          accessor_user_id: user.userId,
          accessor_role: user.role,
          endpoint: metadata.endpoint,
          target_device_id: entry.targetDeviceId,
          target_user_id: entry.targetUserId,
          context: entry.context,
        }),
      );
    }
  }

  private buildEntries(
    metadata: LogLocationAccessOptions,
    request: Request,
    body: unknown,
  ): Array<{
    targetDeviceId?: string | null;
    targetUserId?: string | null;
    context?: string | null;
  }> {
    if (metadata.mapBulk) {
      return this.buildMapBulkEntries(body);
    }

    if (metadata.deviceIdParam) {
      const rawDeviceId = request.params[metadata.deviceIdParam];
      const deviceId = Array.isArray(rawDeviceId) ? rawDeviceId[0] : rawDeviceId;
      const responseBody = body as
        | {
            device?: { id?: string; user?: { id?: string } };
          }
        | undefined;

      return [
        {
          targetDeviceId: deviceId ?? responseBody?.device?.id ?? null,
          targetUserId: responseBody?.device?.user?.id ?? null,
          context: null,
        },
      ];
    }

    return [{ context: null }];
  }

  private buildMapBulkEntries(body: unknown): Array<{
    targetDeviceId?: string | null;
    targetUserId?: string | null;
    context?: string | null;
  }> {
    const payload = body as
      | {
          data?: Array<{
            deviceId?: string;
            hasActiveSos?: boolean;
            sosEventId?: string | null;
            user?: { id?: string } | null;
          }>;
        }
      | undefined;

    if (!payload?.data?.length) {
      return [{ context: 'map_view_empty' }];
    }

    return payload.data
      .filter((item) => !item.hasActiveSos)
      .map((item) => ({
        targetDeviceId: item.deviceId ?? null,
        targetUserId: item.user?.id ?? null,
        context: 'emergency_map_non_sos',
      }));
  }
}
