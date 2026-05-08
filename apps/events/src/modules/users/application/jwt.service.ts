import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../redis/redis.service';

@Injectable()
export class JwtService {
  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async createAccessToken(userId: string, deviceId: string): Promise<string> {
    await this.redisService.set(deviceId, userId, this.configService.get('MAX_AGE_ACCESS_TOKEN_FOR_REDIS'));
    return jwt.sign({ userId, deviceId }, this.configService.get('JWT_SECRET')!, {
      expiresIn: this.configService.get('MAX_AGE_ACCESS_TOKEN'),
    });
  }

  createRefreshToken(userId: string, deviceId: string): string {
    return jwt.sign(
      {
        userId,
        deviceId,
      },
      this.configService.get('JWT_SECRET_REFRESH')!,
      { expiresIn: this.configService.get('MAX_AGE_REFRESH_TOKEN') },
    );
  }
}
