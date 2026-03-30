import { Injectable } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { kExec } from 'ioredis/built/autoPipelining';

@Injectable()
class CacheService {
  constructor(private readonly redisService: RedisService) {}

  async getCache<T>(aggregate: string, key: number): Promise<T | null> {
    const client = this.redisService.getOrThrow();
    const data = await client.get(this.convertKey(aggregate, key));
    if (!data) {
      return null;
    }
    return JSON.parse(data) as T;
  }

  async setCache<T>(
    aggregate: string,
    key: number,
    value: T,
    ttl = 1800,
  ): Promise<void> {
    const cacheKey = this.convertKey(aggregate, key);
    const client = this.redisService.getOrThrow();
    await client.set(cacheKey, JSON.stringify(value), 'EX', ttl);
  }

  private convertKey(aggregate: string, key: number) {
    return `${aggregate}:${key}`;
  }
}

export default CacheService;
