import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';

export interface ActiveUserData {
  userId: string;
  deviceId?: string;
  jti?: string;
}

export const CurrentUser = createParamDecorator((data: keyof ActiveUserData | undefined, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();
  const user = request.user;

  if (!user) throw new InternalServerErrorException('User not found in request');
  return data ? user[data] : user;
});
