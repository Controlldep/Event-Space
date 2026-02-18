import { DeleteResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SessionEntity } from '../domain/session.entity';

@Injectable()
export class SessionRepository {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {}

  async createSession(dto: SessionEntity): Promise<boolean> {
    await this.sessionRepository.upsert(dto, ['userId', 'deviceId']);
    return true;
  }

  async findSessionByDeviceId(deviceId: string): Promise<SessionEntity | null> {
    return await this.sessionRepository.findOne({
      where: { deviceId },
    });
  }

  async findSessionByDeviceIdAndUserID(userId: string, userAgent: string): Promise<SessionEntity | null> {
    return await this.sessionRepository.findOne({
      where: { userId, title: userAgent },
    });
  }

  async getAllSessionsByUser(userId: string): Promise<SessionEntity[]> {
    return await this.sessionRepository.find({
      where: { userId },
    });
  }

  async updateLastActiveDate(userId: string, deviceId: string, newHashJti: string, exp: number) {
    await this.sessionRepository.update(
      { userId, deviceId },
      {
        jtiHash: newHashJti,
        lastActiveDate: new Date().toISOString(),
        expirationDate: new Date(exp * 1000),
      },
    );
  }

  async deleteSessionByDevice(userId: string, deviceId: string): Promise<boolean> {
    const result: DeleteResult = await this.sessionRepository.delete({
      userId,
      deviceId,
    });

    return (result.affected ?? 0) > 0;
  }
}
