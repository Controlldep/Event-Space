import { SessionRepository } from '../infrastructure/session.repository';
import { Injectable } from '@nestjs/common';
import { SessionEntity } from '../domain/session.entity';
import { SessionInputDto } from '../domain/input-dto/session.input.dto';
import { Request } from 'express';
import { createDeviceId } from '../api/helpers/create-device-id';

@Injectable()
export class SessionService {
  constructor(private readonly sessionRepositories: SessionRepository) {}

  async saveSession(sessionData: SessionInputDto): Promise<boolean> {
    const existingSession = await this.sessionRepositories.findSessionByDeviceIdAndUserID(sessionData.userId, sessionData.deviceId);

    if (existingSession) {
      existingSession.jtiHash = sessionData.jtiHash;
      existingSession.lastActiveDate = new Date().toISOString();

      return await this.sessionRepositories.createSession(existingSession);
    }

    const newSession = SessionEntity.createInstance(sessionData);
    return await this.sessionRepositories.createSession(newSession);
  }

  async getAllDevices(userId: string) {
    return await this.sessionRepositories.getAllSessionsByUser(userId);
  }

  async findSessionByDeviceId(deviceId: string): Promise<SessionEntity | null> {
    return await this.sessionRepositories.findSessionByDeviceId(deviceId);
  }

  async getOrCreateDeviceId(req: Request, userId: string) {
    const userAgent: string | null = req.headers['user-agent'] ?? null;
    if (!userAgent) return createDeviceId();

    const findSession: SessionEntity | null = await this.sessionRepositories.findSessionByDeviceIdAndUserID(userId, userAgent);
    if (!findSession) return createDeviceId();

    return findSession.deviceId;
  }

  async deleteDeviceById(userId: string, deviceId: string): Promise<boolean> {
    return await this.sessionRepositories.deleteSessionByDevice(userId, deviceId);
  }

  async updateSessionData(userId: string, deviceId: string, hashJti: string, exp: number) {
    return await this.sessionRepositories.updateLastActiveDate(userId, deviceId, hashJti, exp);
  }
}
