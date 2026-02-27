import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtService {
  constructor(private configService: ConfigService) {}

  createAccessToken(userId: string, deviceId: string): string {
    return jwt.sign({ userId, deviceId }, this.configService.get('JWT_SECRET')!, {
      expiresIn: '10m',
    });
  }

  //TODO придумать как сделать через энв
  createRefreshToken(userId: string, deviceId: string): string {
    return jwt.sign({ userId, deviceId }, this.configService.get('JWT_SECRET_REFRESH')!, { expiresIn: '20m' });
  }
}
