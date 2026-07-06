/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { GuardianController } from './guardian.controller';
import { GuardianService } from './guardian.service';

describe('GuardianController', () => {
  let controller: GuardianController;
  let service: jest.Mocked<GuardianService>;

  const mockGuardianService = {
    addGuardian: jest.fn(),
    getMyGuardians: jest.fn(),
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuardianController],
      providers: [{ provide: GuardianService, useValue: mockGuardianService }],
    }).compile();

    controller = module.get<GuardianController>(GuardianController);
    service = module.get(GuardianService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should add a guardian', async () => {
    const dto = {
      full_name: 'Guardian',
      email: 'g@test.com',
      phone: '9800000001',
      password: 'pass123',
    };
    const req = { user: { userId } } as unknown as Request;
    const expected = {
      message: 'Guardian added successfully',
      guardian: {
        id: 'g-id',
        full_name: 'Guardian',
        email: 'g@t.com',
        phone: '123',
        role: 'GUARDIAN',
      },
    };

    service.addGuardian.mockResolvedValue(expected as any);

    const result = await controller.addGuardian(req, dto);

    expect(service.addGuardian).toHaveBeenCalledWith(userId, dto);
    expect(result).toEqual(expected);
  });

  it('should get my guardians', async () => {
    const req = { user: { userId } } as unknown as Request;
    const expected = {
      guardians: [{ id: 'g-id', full_name: 'Guardian' }],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      message: 'Guardians retrieved successfully',
    };

    service.getMyGuardians.mockResolvedValue(expected as any);

    const result = await controller.getMyGuardians(req, 1, 20);

    expect(service.getMyGuardians).toHaveBeenCalledWith(userId, {
      page: 1,
      limit: 20,
    });
    expect(result).toEqual(expected);
  });
});
