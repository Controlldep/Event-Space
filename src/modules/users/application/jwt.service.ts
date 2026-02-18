import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { PasswordService } from './password.service';

@Injectable()
export class JwtService {
  constructor(private readonly passwordService: PasswordService) {}

  createAccessToken(userId: string): string {
    //TODO разобраться с zod
    return jwt.sign({ userId }, process.env.JWT_SECRET!, {
      expiresIn: '10m',
    });
  }

  async createRefreshToken(userId: string, deviceId: string) {
    //TODO разобраться с zod
    const jti: string = this.passwordService.generateRandomBytes();
    const hashJti: string = await this.passwordService.hashPassword(jti);

    const refreshToken: string = jwt.sign({ userId, jti, deviceId }, process.env.JWT_SECRET_REFRESH!, { expiresIn: '20m' });

    return { refreshToken, hashJti };
  }
}
