import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from 'src/redis/redis.constants';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async set(key: string, value: string | number, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.set(key, value, 'EX', ttl);
    } else {
      await this.redis.set(key, value);
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const data: string | null = await this.redis.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`[RedisService] Ошибка парсинга ключа ${key}:`, e);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async hset(key: string, field: string, value: any): Promise<void> {
    await this.redis.hset(key, field, JSON.stringify(value));
  }

  async hget(key: string, field: string): Promise<any | null> {
    const data = await this.redis.hget(key, field);
    return data ? JSON.parse(data) : null;
  }
}
