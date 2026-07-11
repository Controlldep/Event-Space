import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { createHash } from 'crypto';

@Injectable()
export class PasswordService {
  private readonly saltRounds = 10;

  generateRandomBytes(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(password: string, passwordHash: string): Promise<boolean> {
    return await bcrypt.compare(password, passwordHash);
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
