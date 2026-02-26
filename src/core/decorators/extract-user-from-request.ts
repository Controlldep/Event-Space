import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CustomHttpException, DomainExceptionCode } from '../exceptions/domain.exceptions';

export interface ActiveUserData {
  userId: string;
  deviceId: string;
}

export const CurrentUser = createParamDecorator((data: keyof ActiveUserData | undefined, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();
  const user = request.user;

  if (!user) throw new CustomHttpException(DomainExceptionCode.UNAUTHORIZED, 'User not found in request');
  return data ? user[data] : user;
});
