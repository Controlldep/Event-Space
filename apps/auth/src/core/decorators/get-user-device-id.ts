import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUserDeviceId = createParamDecorator((data: unknown, context: ExecutionContext): string | null => {
  const request: Request = context.switchToHttp().getRequest();
  const getDeviceId = request.headers['x-device-id'];
  if (!getDeviceId) return null;
  if (Array.isArray(getDeviceId)) return getDeviceId[0];

  return getDeviceId;
});
