/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { TokenService } from 'src/utils/token/token.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<Repository<User>>;
  let tokenService: jest.Mocked<TokenService>;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const mockTokenService = {
    generateToken: jest.fn(),
  };

  const makeUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-id',
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
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(getRepositoryToken(User));
    tokenService = module.get(TokenService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a user', async () => {
      const dto: CreateUserDto = {
        full_name: 'Ujwal',
        email: 'ujwal@gmail.com',
        phone: '9800000000',
        password: 'password',
        role: Role.USER,
      };
      const createdUser = makeUser();
      const savedUser = makeUser();

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(createdUser);
      repository.save.mockResolvedValue(savedUser);

      const result = await service.register(dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: [{ email: dto.email }, { phone: dto.phone }],
      });
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: dto.full_name,
          email: dto.email,
          phone: dto.phone,
          role: dto.role,
        }),
      );
      expect(repository.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(savedUser);
    });
  });

  describe('login', () => {
    it('should return user data and generated tokens for valid credentials', async () => {
      const user = makeUser({
        password_hash: await bcrypt.hash('password', 12),
      });
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
      };

      repository.findOne.mockResolvedValue(user);
      tokenService.generateToken.mockResolvedValue(tokens as never);

      const result = await service.login({
        email: user.email,
        password: 'password',
      });

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: user.email },
      });
      expect(tokenService.generateToken).toHaveBeenCalledWith({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      });
      expect(result).toEqual({
        message: 'Login Successfull',
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        ...tokens,
      });
    });
  });

  describe('findAll', () => {
    it('should return all users without password_hash', async () => {
      const users = [
        makeUser(),
        makeUser({ id: 'second-user-id', email: 'ram@gmail.com' }),
      ];
      const expected = users.map(({ password_hash, ...rest }) => rest);

      repository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should return one user without password_hash', async () => {
      const user = makeUser();
      const { password_hash, ...expected } = user;

      repository.findOneBy.mockResolvedValue(user);

      const result = await service.findOne('user-id');

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 'user-id' });
      expect(result).toEqual(expected);
    });

    it('should return null if user is not found', async () => {
      repository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne('missing-user-id');

      expect(repository.findOneBy).toHaveBeenCalledWith({
        id: 'missing-user-id',
      });
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const dto: UpdateUserDto = {
        full_name: 'Updated Name',
        email: 'updated@gmail.com',
      };
      const updatedUser = makeUser({
        full_name: dto.full_name,
        email: dto.email,
      });
      const { password_hash, ...expected } = updatedUser;

      repository.update.mockResolvedValue({ affected: 1 } as UpdateResult);
      repository.findOneBy.mockResolvedValue(updatedUser);

      const result = await service.update('user-id', dto);

      expect(repository.update).toHaveBeenCalledWith(
        'user-id',
        expect.objectContaining({
          full_name: dto.full_name,
          email: dto.email,
        }),
      );
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 'user-id' });
      expect(result).toEqual(expected);
    });

    it('should return null if updated user is not found', async () => {
      repository.update.mockResolvedValue({ affected: 0 } as UpdateResult);
      repository.findOneBy.mockResolvedValue(null);

      const result = await service.update('missing-user-id', {
        full_name: 'Not Found',
      });

      expect(repository.findOneBy).toHaveBeenCalledWith({
        id: 'missing-user-id',
      });
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should delete user by id', async () => {
      const deleteResult = {
        affected: 1,
      } as DeleteResult;

      repository.delete.mockResolvedValue(deleteResult);

      const result = await service.remove('user-id');

      expect(repository.delete).toHaveBeenCalledWith({ id: 'user-id' });
      expect(result).toEqual(deleteResult);
    });
  });
});
