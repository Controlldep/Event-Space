import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/redis/redis.constants';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/redis/redis.service';

@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService) => {
        return new Redis({
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
          password: config.get('REDIS_PASSWORD'),
          db: config.get('REDIS_DB'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
