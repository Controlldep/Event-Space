import { SessionInputDto } from '../../domain/input-dto/session.input.dto';
import { getClientIp } from './get-client-ip';
import { Request } from 'express';

export function createSession(req: Request, deviceId: string, userId: string, jtiHash: string): SessionInputDto {
  const ip: string = getClientIp(req);
  const title: string = req.headers['user-agent'] ?? 'Unknown device';
  const expirationDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const createSessionDto: SessionInputDto = {
    userId: userId,
    deviceId: deviceId,
    ip,
    title,
    jtiHash,
    lastActiveDate: new Date().toISOString(),
    expirationDate,
  };

  return createSessionDto;
}
