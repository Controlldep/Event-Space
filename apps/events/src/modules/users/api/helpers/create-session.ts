import { SessionInputDto } from '../../domain/input-dto/session.input.dto';
import ms, { StringValue } from 'ms';

export function createSession(
  userId: string,
  deviceId: string,
  ip: string,
  userAgent: string,
  refreshTokenHash: string,
  maxAge: string,
): SessionInputDto {
  const createSessionDto: SessionInputDto = {
    userId: userId,
    deviceId: deviceId,
    ip,
    userAgent,
    refreshTokenHash,
    lastActiveDate: new Date(),
    expirationDate: new Date(Date.now() + ms(maxAge as StringValue)),
  };

  return createSessionDto;
}
