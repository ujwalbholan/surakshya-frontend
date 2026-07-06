/// <reference types="jest" />

import Redis from 'ioredis';
import { RedisService } from './redis.service';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
  }));
});

describe('RedisService', () => {
  let service: RedisService;
  let redisMock: {
    set: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
    quit: jest.Mock;
    on: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';
    delete process.env.REDIS_URL;
    delete process.env.REDIS_PASSWORD;

    service = new RedisService();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    redisMock = (Redis as unknown as jest.Mock).mock.results[0].value;
  });

  afterEach(() => {
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_URL;
    delete process.env.REDIS_PASSWORD;
  });

  it('should create Redis client with env host and port', () => {
    expect(Redis).toHaveBeenCalledWith({
      host: 'localhost',
      port: 6379,
      password: undefined,
    });
  });

  it('should prefer REDIS_URL when provided', () => {
    process.env.REDIS_URL = 'redis://render-redis:6379';

    new RedisService();

    expect(Redis).toHaveBeenLastCalledWith('redis://render-redis:6379');
  });

  it('should use default host and port if env is not provided', () => {
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;

    new RedisService();

    expect(Redis).toHaveBeenLastCalledWith({
      host: '127.0.0.1',
      port: 6379,
      password: undefined,
    });
  });

  it('should return redis client', () => {
    expect(service.getClient()).toBe(redisMock);
  });

  it('should set value without ttl', async () => {
    redisMock.set.mockResolvedValue('OK');

    const result = await service.set('token:1', 'abc');

    expect(redisMock.set).toHaveBeenCalledWith('token:1', 'abc');
    expect(result).toBe('OK');
  });

  it('should set value with ttl', async () => {
    redisMock.set.mockResolvedValue('OK');

    const result = await service.set('token:1', 'abc', 60);

    expect(redisMock.set).toHaveBeenCalledWith('token:1', 'abc', 'EX', 60);
    expect(result).toBe('OK');
  });

  it('should not use ttl when ttlSecond is 0', async () => {
    redisMock.set.mockResolvedValue('OK');

    await service.set('token:1', 'abc', 0);

    expect(redisMock.set).toHaveBeenCalledWith('token:1', 'abc');
  });

  it('should get value by key', async () => {
    redisMock.get.mockResolvedValue('abc');

    const result = await service.get('token:1');

    expect(redisMock.get).toHaveBeenCalledWith('token:1');
    expect(result).toBe('abc');
  });

  it('should return null when key does not exist', async () => {
    redisMock.get.mockResolvedValue(null);

    const result = await service.get('missing-key');

    expect(result).toBeNull();
  });

  it('should delete key', async () => {
    redisMock.del.mockResolvedValue(1);

    const result = await service.del('token:1');

    expect(redisMock.del).toHaveBeenCalledWith('token:1');
    expect(result).toBe(1);
  });

  it('should return 0 when deleting non-existing key', async () => {
    redisMock.del.mockResolvedValue(0);

    const result = await service.del('missing-key');

    expect(result).toBe(0);
  });

  it('should quit redis connection on module destroy', async () => {
    redisMock.quit.mockResolvedValue('OK');

    const result = await service.onModuleDestroy();

    expect(redisMock.quit).toHaveBeenCalled();
    expect(result).toBe('OK');
  });
});
