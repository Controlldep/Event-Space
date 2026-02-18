import { Request } from 'express';

export function getClientIp(req: Request): string {
  const ip: string =
    req.ip || (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || req.socket.remoteAddress || '0.0.0.0';

  return ip.replace(/^::ffff:/, '');
}
