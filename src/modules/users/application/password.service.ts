import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import crypto from 'node:crypto';

@Injectable()
export class PasswordService {
  private readonly saltRounds = 10;

  generateRandomBytes(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}
