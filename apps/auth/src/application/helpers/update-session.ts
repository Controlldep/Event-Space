import { UpdateSessionDto } from '../dto/input/update-session.dto';
import ms, { StringValue } from 'ms';

export function UpdateUserSession(ip: string, userAgent: string, refreshTokenHash: string, maxAge: string): UpdateSessionDto {
  const updateSession: UpdateSessionDto = {
    ip,
    userAgent,
    refreshTokenHash,
    lastActiveDate: new Date(),
    expirationDate: new Date(Date.now() + ms(maxAge as StringValue)),
  };

  return updateSession;
}
