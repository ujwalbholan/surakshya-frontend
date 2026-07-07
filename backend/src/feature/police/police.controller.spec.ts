import { Test, TestingModule } from '@nestjs/testing';
import { PoliceController } from './police.controller';
import { PoliceService } from './police.service';
import { LocationAccessAuditInterceptor } from 'src/feature/audit/location-access-audit.interceptor';

describe('PoliceController', () => {
  let controller: PoliceController;
  let service: jest.Mocked<PoliceService>;

  const mockPoliceService = {
    getDashboard: jest.fn(),
    getActiveSosEvents: jest.fn(),
    getSosEventDetails: jest.fn(),
    resolveSosEvent: jest.fn(),
    getDeviceLatestLocation: jest.fn(),
    getUserInfo: jest.fn(),
    getUserGuardians: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PoliceController],
      providers: [{ provide: PoliceService, useValue: mockPoliceService }],
    })
      .overrideInterceptor(LocationAccessAuditInterceptor)
      .useValue({
        intercept: (_context: unknown, next: { handle: () => unknown }) =>
          next.handle(),
      })
      .compile();

    controller = module.get<PoliceController>(PoliceController);
    service = module.get(PoliceService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get dashboard', async () => {
    const expected = {
      activeSosEvents: 5,
      totalDevices: 100,
      totalUsers: 500,
      sosEventsToday: 3,
      pingsToday: 1200,
      resolvedToday: [],
    };
    service.getDashboard.mockResolvedValue(expected);

    const result = await controller.getDashboard();

    expect(result).toEqual(expected);
  });

  it('should get active SOS events', async () => {
    const expected = {
      data: [
        {
          id: 'sos-1',
          deviceId: 'dev-1',
          imei: '123',
          label: 'd',
          status: 'active',
          startedAt: new Date(),
        },
      ],
      total: 1,
    };
    service.getActiveSosEvents.mockResolvedValue(expected as any);

    const result = await controller.getActiveSosEvents();

    expect(result).toEqual(expected);
  });

  it('should get SOS event details', async () => {
    const expected = {
      id: 'sos-1',
      locationPings: [],
      device: { id: 'dev-1', imei: '123', label: 'd', isOnline: true },
      status: 'active',
      startedAt: new Date(),
    };
    service.getSosEventDetails.mockResolvedValue(expected as any);

    const result = await controller.getSosEventDetails('sos-1');

    expect(result).toEqual(expected);
  });

  it('should resolve SOS event', async () => {
    const expected = {
      id: 'sos-1',
      status: 'resolved',
      device: { id: 'dev-1', imei: '123', label: 'd', isOnline: true },
      startedAt: new Date(),
    };
    service.resolveSosEvent.mockResolvedValue(expected as any);

    const result = await controller.resolveSosEvent('sos-1', { notes: 'Resolved on scene' });

    expect(result).toEqual(expected);
  });

  it('should get device latest location', async () => {
    const expected = {
      device: { id: 'dev-1', imei: '123', label: 'd' },
      lastLocation: null,
    };
    service.getDeviceLatestLocation.mockResolvedValue(expected);

    const result = await controller.getDeviceLatestLocation('dev-1');

    expect(result).toEqual(expected);
  });

  it('should get user info', async () => {
    const expected = {
      id: 'user-1',
      full_name: 'Test',
      email: 't@t.com',
      phone: '123',
      role: 'USER',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
    service.getUserInfo.mockResolvedValue(expected as any);

    const result = await controller.getUserInfo('user-1');

    expect(result).toEqual(expected);
  });

  it('should get user guardians', async () => {
    const expected = {
      guardians: [
        {
          id: 'g-1',
          full_name: 'G',
          email: 'g@t.com',
          phone: '123',
          role: 'GUARDIAN',
          created_at: new Date(),
        },
      ],
    };
    service.getUserGuardians.mockResolvedValue(expected as any);

    const result = await controller.getUserGuardians('user-1');

    expect(result).toEqual(expected);
  });
});
