import { SessionRepository } from '../infrastructure/session.repository';
import { Injectable } from '@nestjs/common';
import { SessionEntity } from '../domain/session.entity';
import { SessionInputDto } from '../domain/input-dto/session.input.dto';
import { UpdateSessionDto } from './dto/input/update-session.dto';

@Injectable()
export class SessionService {
  constructor(private readonly sessionRepositories: SessionRepository) {}

  async saveSession(sessionData: SessionInputDto): Promise<void> {
    const newSession: SessionEntity = SessionEntity.createInstance(sessionData);
    return await this.sessionRepositories.saveSession(newSession);
  }

  async getAllDevices(userId: string): Promise<SessionEntity[]> {
    return await this.sessionRepositories.getAllSessionsByUser(userId);
  }

  async findSessionByDeviceId(deviceId: string): Promise<SessionEntity | null> {
    return await this.sessionRepositories.findSessionByDeviceId(deviceId);
  }

  async findSessionByDeviceIdAndUserId(userId: string, deviceId: string): Promise<SessionEntity | null> {
    return await this.sessionRepositories.findSessionByDeviceIdAndUserId(userId, deviceId);
  }

  async deleteDeviceById(userId: string, deviceId: string): Promise<boolean> {
    return await this.sessionRepositories.deleteSessionByDevice(userId, deviceId);
  }

  async updateSession(userId: string, deviceId: string, dto: UpdateSessionDto): Promise<void> {
    return await this.sessionRepositories.updateSession(userId, deviceId, dto);
  }

  async updateRefreshForSession(userId: string, deviceId: string, refreshTokenHash: string): Promise<void> {
    return await this.sessionRepositories.updateRefreshForSession(userId, deviceId, refreshTokenHash);
  }
}
