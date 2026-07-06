import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { RedisService } from './redis.service';

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redisService: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const redisKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `throttle:block:${throttlerName}:${key}`;
    const windowMs = ttl;

    const isBlocked = await this.redisService.getClient().get(blockKey);
    if (isBlocked) {
      const ttlMs = await this.redisService.getClient().pttl(blockKey);
      return {
        totalHits: limit + 1,
        timeToExpire: Math.ceil(ttlMs / 1000),
        isBlocked: true,
        timeToBlockExpire: Math.ceil(ttlMs / 1000),
      };
    }

    const current = await this.redisService.getClient().incr(redisKey);

    if (current === 1) {
      await this.redisService.getClient().pexpire(redisKey, windowMs);
    }

    const pttl = await this.redisService.getClient().pttl(redisKey);
    const timeToExpire = Math.max(0, Math.ceil(pttl / 1000));

    if (current > limit) {
      await this.redisService
        .getClient()
        .setex(blockKey, Math.ceil(blockDuration / 1000), '1');
      const blockTtl = await this.redisService.getClient().pttl(blockKey);
      return {
        totalHits: current,
        timeToExpire,
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockTtl / 1000),
      };
    }

    return {
      totalHits: current,
      timeToExpire,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }
}
