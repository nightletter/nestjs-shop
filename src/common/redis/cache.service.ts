import { Injectable } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';

@Injectable()
export class CacheService {
  constructor(private readonly redisService: RedisService) {}

  async setCache<T>(key: string, value: T, ttl = 3600): Promise<void> {
    const client = this.redisService.getOrThrow();
    await client.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async getCache<T>(key: string): Promise<T | null> {
    const client = this.redisService.getOrThrow();
    const data = await client.get(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as T;
  }
}
