import { Test, TestingModule } from '@nestjs/testing';
import { PoliceProvisioningController } from './police-provisioning.controller';
import { PoliceProvisioningService } from './police-provisioning.service';

describe('PoliceProvisioningController', () => {
  let controller: PoliceProvisioningController;
  let service: jest.Mocked<PoliceProvisioningService>;

  const mockService = {
    createPoliceAccount: jest.fn(),
    resendTempPassword: jest.fn(),
    listPendingStationLinks: jest.fn(),
    approveStationLink: jest.fn(),
    rejectStationLink: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PoliceProvisioningController],
      providers: [
        {
          provide: PoliceProvisioningService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(PoliceProvisioningController);
    service = module.get(PoliceProvisioningService);
    jest.clearAllMocks();
  });

  it('creates a police account', async () => {
    const dto = {
      full_name: 'Officer',
      email: 'officer@test.com',
      phone: '9800000000',
      station_id: '550e8400-e29b-41d4-a716-446655440000',
    };
    const req = { user: { userId: 'admin-id' } } as never;
    service.createPoliceAccount.mockResolvedValue({
      message: 'ok',
      email: dto.email,
      user_id: 'user-id',
    });

    const result = await controller.create(dto, req);

    expect(service.createPoliceAccount).toHaveBeenCalledWith('admin-id', dto);
    expect(result.user_id).toBe('user-id');
  });

  it('lists pending links for super admin', async () => {
    const req = { user: { userId: 'super-admin-id' } } as never;
    service.listPendingStationLinks.mockResolvedValue({
      message: 'ok',
      links: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await controller.listPendingLinks({ page: 1, limit: 20 }, req);

    expect(service.listPendingStationLinks).toHaveBeenCalledWith(
      'super-admin-id',
      { page: 1, limit: 20 },
    );
  });

  it('rejects a station link with reason', async () => {
    const req = { user: { userId: 'super-admin-id' } } as never;
    const linkId = '550e8400-e29b-41d4-a716-446655440001';
    service.rejectStationLink.mockResolvedValue({
      message: 'rejected',
      link_id: linkId,
    });

    await controller.rejectLink(linkId, { reason: 'Wrong station' }, req);

    expect(service.rejectStationLink).toHaveBeenCalledWith(
      'super-admin-id',
      linkId,
      'Wrong station',
    );
  });
});
