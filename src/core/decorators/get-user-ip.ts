import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const GetUserIp = createParamDecorator((data: unknown, context: ExecutionContext): string => {
  const req: Request = context.switchToHttp().getRequest();
  const xForwardedForHeaders = req.headers['x-forwarded-for'];
  const xForwardedForIPs = Array.isArray(xForwardedForHeaders)
    ? xForwardedForHeaders.flatMap((header: string) => header.trim().split(','))
    : [xForwardedForHeaders];

  const ip: string = req.ip || xForwardedForIPs?.filter(Boolean)?.[0]?.trim() || req.socket.remoteAddress || '0.0.0.0';

  return ip.replace(/^::ffff:/, '');
});
