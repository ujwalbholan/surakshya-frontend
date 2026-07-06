import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL;

    this.client = redisUrl
      ? new Redis(redisUrl)
      : new Redis({
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: process.env.REDIS_PORT
            ? parseInt(process.env.REDIS_PORT, 10)
            : 6379,
          password: process.env.REDIS_PASSWORD || undefined,
        });

    this.client.on('error', (error: Error) => {
      this.logger.error(`Redis connection failed: ${error.message}`);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async set(key: string, value: string, ttlSecond?: number) {
    if (ttlSecond) {
      return this.client.set(key, value, 'EX', ttlSecond);
    }

    return this.client.set(key, value);
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async del(key: string) {
    return this.client.del(key);
  }

  async onModuleDestroy() {
    return this.client.quit();
  }
}
