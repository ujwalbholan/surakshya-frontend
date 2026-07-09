/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let service: jest.Mocked<AdminService>;

  const mockAdminService = {
    getStats: jest.fn(),
    getUsers: jest.fn(),
    getUserDetails: jest.fn(),
    updateUserStatus: jest.fn(),
    updateUserRole: jest.fn(),
    getDevices: jest.fn(),
    createDevice: jest.fn(),
    assignDevice: jest.fn(),
    unassignDevice: jest.fn(),
    getSosEvents: jest.fn(),
    getSosEventDetails: jest.fn(),
    resolveSosEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: mockAdminService }],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get(AdminService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get stats', async () => {
    const expected = { totalUsers: 100 } as any;
    service.getStats.mockResolvedValue(expected);

    const result = await controller.getStats();

    expect(result).toEqual(expected);
  });

  it('should get paginated users excluding self', async () => {
    const expected = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    const req = { user: { userId: 'admin-id' } } as unknown as Request;
    service.getUsers.mockResolvedValue(expected);

    const result = await controller.getUsers(
      req,
      undefined,
      undefined,
      undefined,
      1,
      20,
    );

    expect(result).toEqual(expected);
    expect(service.getUsers).toHaveBeenCalledWith({
      excludeUserId: 'admin-id',
      role: undefined,
      is_active: undefined,
      search: undefined,
      page: 1,
      limit: 20,
    });
  });

  it('should get user details', async () => {
    const expected = {
      id: 'user-1',
      guardianLinks: [],
      full_name: 'Test',
      email: 't@t.com',
      phone: '123',
      role: 'USER',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
    service.getUserDetails.mockResolvedValue(expected as any);

    const result = await controller.getUserDetails('user-1');

    expect(result).toEqual(expected);
  });

  it('should update user status', async () => {
    const dto = { is_active: false };
    const expected = {
      id: 'user-1',
      is_active: false,
      full_name: 'Test',
      phone: '123',
      email: 't@t.com',
      role: 'USER',
      created_at: new Date(),
      updated_at: new Date(),
    };
    service.updateUserStatus.mockResolvedValue(expected as any);

    const result = await controller.updateUserStatus('user-1', dto);

    expect(result).toEqual(expected);
  });

  it('should update user role', async () => {
    const dto = { role: 'ADMIN' as any };
    const expected = {
      id: 'user-1',
      role: 'ADMIN',
      full_name: 'Test',
      phone: '123',
      email: 't@t.com',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
    service.updateUserRole.mockResolvedValue(expected as any);

    const result = await controller.updateUserRole('user-1', dto);

    expect(result).toEqual(expected);
  });

  it('should get devices', async () => {
    const expected = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    service.getDevices.mockResolvedValue(expected);

    const result = await controller.getDevices(1, 20);

    expect(result).toEqual(expected);
  });

  it('should create device', async () => {
    const dto = { imei: 'wearable-001', label: 'Test Band' };
    const expected = {
      id: 'dev-1',
      imei: 'wearable-001',
      label: 'Test Band',
      isOnline: false,
      lastSeenAt: null,
      user: null,
    };
    service.createDevice.mockResolvedValue(expected);

    const result = await controller.createDevice(dto);

    expect(result).toEqual(expected);
    expect(service.createDevice).toHaveBeenCalledWith(dto);
  });

  it('should assign device to user', async () => {
    const dto = { userId: 'user-1' };
    const expected = {
      id: 'dev-1',
      imei: 'wearable-001',
      label: 'Band',
      isOnline: true,
      lastSeenAt: null,
      user: {
        id: 'user-1',
        full_name: 'Test',
        email: 't@t.com',
        phone: '123',
        role: 'USER',
      },
    };
    service.assignDevice.mockResolvedValue(expected);

    const result = await controller.assignDevice('dev-1', dto);

    expect(result).toEqual(expected);
    expect(service.assignDevice).toHaveBeenCalledWith('dev-1', 'user-1');
  });

  it('should unassign device', async () => {
    const expected = {
      id: 'dev-1',
      imei: 'wearable-001',
      label: 'Band',
      isOnline: true,
      lastSeenAt: null,
      user: null,
    };
    service.unassignDevice.mockResolvedValue(expected);

    const result = await controller.unassignDevice('dev-1');

    expect(result).toEqual(expected);
    expect(service.unassignDevice).toHaveBeenCalledWith('dev-1');
  });

  it('should get SOS events', async () => {
    const expected = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    service.getSosEvents.mockResolvedValue(expected);

    const result = await controller.getSosEvents(undefined, 1, 20);

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

    const result = await controller.resolveSosEvent('sos-1');

    expect(result).toEqual(expected);
  });
});
