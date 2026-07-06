import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, lastValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { LocationAccessAuditInterceptor } from './location-access-audit.interceptor';
import { LocationAccessLog } from './entities/location-access-log.entity';

describe('LocationAccessAuditInterceptor', () => {
  let interceptor: LocationAccessAuditInterceptor;
  let reflector: jest.Mocked<Reflector>;
  let accessLogRepo: jest.Mocked<
    Pick<Repository<LocationAccessLog>, 'save' | 'create'>
  >;

  beforeEach(() => {
    reflector = {
      get: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    accessLogRepo = {
      create: jest.fn((value) => value as LocationAccessLog),
      save: jest.fn().mockResolvedValue(undefined),
    };

    interceptor = new LocationAccessAuditInterceptor(
      reflector,
      accessLogRepo as unknown as Repository<LocationAccessLog>,
    );
  });

  it('persists a log entry for police device location lookups', async () => {
    reflector.get.mockReturnValue({
      endpoint: 'GET /police/devices/:id/location',
      deviceIdParam: 'id',
    });

    const request = {
      params: { id: 'device-uuid-1' },
      user: { userId: 'police-uuid', role: 'POLICE' },
    };

    const context = {
      getHandler: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    const next: CallHandler = {
      handle: () =>
        of({
          device: { id: 'device-uuid-1', imei: '123', label: 'Band' },
          lastLocation: null,
        }),
    };

    await lastValueFrom(interceptor.intercept(context, next));

    expect(accessLogRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        accessor_user_id: 'police-uuid',
        accessor_role: 'POLICE',
        endpoint: 'GET /police/devices/:id/location',
        target_device_id: 'device-uuid-1',
      }),
    );
  });

  it('skips SOS-context map entries for emergency map lookups', async () => {
    reflector.get.mockReturnValue({
      endpoint: 'GET /emergency/map',
      mapBulk: true,
    });

    const request = {
      params: {},
      user: { userId: 'admin-uuid', role: 'ADMIN' },
    };

    const context = {
      getHandler: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    const next: CallHandler = {
      handle: () =>
        of({
          data: [
            {
              deviceId: 'device-1',
              hasActiveSos: true,
              user: { id: 'user-1' },
            },
            {
              deviceId: 'device-2',
              hasActiveSos: false,
              user: { id: 'user-2' },
            },
          ],
          total: 2,
        }),
    };

    await lastValueFrom(interceptor.intercept(context, next));

    expect(accessLogRepo.save).toHaveBeenCalledTimes(1);
    expect(accessLogRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        target_device_id: 'device-2',
        target_user_id: 'user-2',
        context: 'emergency_map_non_sos',
      }),
    );
  });

  it('passes through when handler is not decorated', async () => {
    reflector.get.mockReturnValue(undefined);

    const context = {
      getHandler: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    const next: CallHandler = {
      handle: () => of({ ok: true }),
    };

    await lastValueFrom(interceptor.intercept(context, next));

    expect(accessLogRepo.save).not.toHaveBeenCalled();
  });
});
