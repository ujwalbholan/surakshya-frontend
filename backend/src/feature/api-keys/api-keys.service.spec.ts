import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { API_KEY_PREFIX_VISIBLE_CHARS } from 'src/constants/api-keys.constants';
import { ApiKeysService } from './api-keys.service';
import { ApiKey } from './entities/api-key.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-secret'),
  compare: jest.fn(),
}));

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let repo: jest.Mocked<Repository<ApiKey>>;

  const keyId = '550e8400-e29b-41d4-a716-446655440020';
  const actorId = '550e8400-e29b-41d4-a716-446655440021';

  const mockKey = (overrides: Partial<ApiKey> = {}): ApiKey =>
    ({
      id: keyId,
      name: 'Production Mobile App',
      prefix: 'sk_abcde',
      key_hash: 'hashed-secret',
      created_by_id: actorId,
      created_by: null,
      last_used_at: null,
      revoked_at: null,
      created_at: new Date('2026-07-01T00:00:00.000Z'),
      updated_at: new Date('2026-07-01T00:00:00.000Z'),
      ...overrides,
    }) as ApiKey;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        {
          provide: getRepositoryToken(ApiKey),
          useValue: {
            create: jest.fn((data) => data),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ApiKeysService);
    repo = module.get(getRepositoryToken(ApiKey));
    jest.clearAllMocks();
  });

  it(`creates a key and returns the full secret once with ${API_KEY_PREFIX_VISIBLE_CHARS}-char prefix`, async () => {
    let stored: ApiKey | undefined;
    repo.save.mockImplementation(async (entity) => {
      stored = {
        ...mockKey(),
        ...(entity as ApiKey),
        id: keyId,
      };
      return stored;
    });
    repo.findOne.mockImplementation(async () => stored!);

    const result = await service.create('Production Mobile App', actorId);

    expect(bcrypt.hash).toHaveBeenCalled();
    expect(result.secret).toMatch(/^sk_[a-f0-9]+$/);
    expect(result.secret.length).toBeGreaterThan(API_KEY_PREFIX_VISIBLE_CHARS);
    expect(result.api_key.prefix).toHaveLength(API_KEY_PREFIX_VISIBLE_CHARS);
    expect(result.api_key.prefix).toBe(
      result.secret.slice(0, API_KEY_PREFIX_VISIBLE_CHARS),
    );
  });

  it('lists keys without secrets', async () => {
    repo.find.mockResolvedValue([mockKey()]);

    const result = await service.findAll();

    expect(result.api_keys).toHaveLength(1);
    expect(result.api_keys[0]).not.toHaveProperty('key_hash');
    expect(result.api_keys[0]).not.toHaveProperty('secret');
  });

  it('revokes an active key', async () => {
    const key = mockKey();
    repo.findOne.mockResolvedValue(key);
    repo.save.mockImplementation(async (entity) => entity as ApiKey);

    const result = await service.revoke(keyId);

    expect(result.api_key.revoked_at).toBeInstanceOf(Date);
  });

  it('rejects revoking an already revoked key', async () => {
    repo.findOne.mockResolvedValue(
      mockKey({ revoked_at: new Date('2026-07-02T00:00:00.000Z') }),
    );

    await expect(service.revoke(keyId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws when key is missing', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.revoke(keyId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
