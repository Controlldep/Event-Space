import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUserAgent = createParamDecorator((data: unknown, context: ExecutionContext): string => {
  const request: Request = context.switchToHttp().getRequest();
  const userAgent: string | string[] | undefined = request.headers['user-agent'];
  if (Array.isArray(userAgent)) {
    return userAgent[0];
  }

  return userAgent ?? '';
});
