/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { DeleteResult } from 'typeorm';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let service: jest.Mocked<UserService>;

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const userId = '0fbd7095-f451-48f7-a860-ccd0d88057a1';

  const makeUser = (overrides: Partial<User> = {}): User => ({
    id: userId,
    full_name: 'Ujwal',
    email: 'ujwal@gmail.com',
    phone: '9800000000',
    password_hash: 'hashed-password',
    role: Role.USER,
    is_active: true,
    phone_verified: false,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get(UserService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all users except self', async () => {
    const users = [
      makeUser(),
      makeUser({ id: 'second-user-id', email: 'ram@gmail.com' }),
    ];
    const req = { user: { userId } } as unknown as Request;

    service.findAll.mockResolvedValue(users);

    const result = await controller.findAll(req);

    expect(service.findAll).toHaveBeenCalledWith(userId);
    expect(result).toEqual(users);
  });

  it('should return one user by id', async () => {
    const user = makeUser();

    service.findOne.mockResolvedValue(user);

    const result = await controller.findOne(userId);

    expect(service.findOne).toHaveBeenCalledWith(userId);
    expect(result).toEqual(user);
  });

  it('should return authenticated user from request', () => {
    const authUser = {
      userId,
      role: Role.USER,
      sessionId: 'session-id',
    };
    const req = { user: authUser } as unknown as Request;

    const result = controller.me(req);

    expect(result).toEqual({
      message: 'Authenticated user',
      user: authUser,
    });
  });

  it('should update user by id', async () => {
    const dto = {
      full_name: 'Updated Name',
      email: 'updated@gmail.com',
    };
    const updatedUser = makeUser(dto);

    service.update.mockResolvedValue(updatedUser);

    const result = await controller.update(userId, dto);

    expect(service.update).toHaveBeenCalledWith(userId, dto);
    expect(result).toEqual(updatedUser);
  });

  it('should delete user by id', async () => {
    const deleteResult = {
      affected: 1,
    } as DeleteResult;

    service.remove.mockResolvedValue(deleteResult);

    const result = await controller.remove(userId);

    expect(service.remove).toHaveBeenCalledWith(userId);
    expect(result).toEqual(deleteResult);
  });
});
