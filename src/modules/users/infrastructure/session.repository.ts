import { DeleteResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SessionEntity } from '../domain/session.entity';
import { UpdateSessionDto } from '../application/dto/input/update-session.dto';
import { SessionInputDto } from '../domain/input-dto/session.input.dto';

@Injectable()
export class SessionRepository {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {}

  async saveSession(dto: SessionInputDto) {
    const maxSessions = 5;

    const [sessions, count] = await this.sessionRepository.findAndCount({
      where: { userId: dto.userId },
      order: { lastActiveDate: 'ASC' },
    });

    if (count >= maxSessions) {
      const oldestSession = sessions[0];
      await this.sessionRepository.delete(oldestSession.id);
    }
    await this.sessionRepository.save(dto);
  }

  async findSessionByDeviceId(deviceId: string): Promise<SessionEntity | null> {
    return await this.sessionRepository.findOne({
      where: { deviceId },
    });
  }

  async findSessionByDeviceIdAndUserId(userId: string, deviceId: string): Promise<SessionEntity | null> {
    return await this.sessionRepository.findOne({
      where: { userId, deviceId },
    });
  }

  async getAllSessionsByUser(userId: string): Promise<SessionEntity[]> {
    return await this.sessionRepository.find({
      where: { userId },
    });
  }

  async updateSession(userId: string, deviceId: string, dto: UpdateSessionDto) {
    await this.sessionRepository.update({ userId, deviceId }, dto);
  }

  async updateRefreshForSession(userId: string, deviceId: string, refreshTokenHash: string) {
    await this.sessionRepository.update({ userId, deviceId }, { refreshTokenHash });
  }

  async deleteSessionByDevice(userId: string, deviceId: string): Promise<boolean> {
    const result: DeleteResult = await this.sessionRepository.delete({
      userId,
      deviceId,
    });

    return (result.affected ?? 0) > 0;
  }
}
