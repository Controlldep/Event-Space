import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CustomHttpException, DomainExceptionCode } from '@app/exceptions/domain.exceptions';
import { UserRole } from '../../../apps/auth/src/domain/enum/user-role.type';

export interface ActiveUserData {
  userId: string;
  deviceId: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator((data: keyof ActiveUserData | undefined, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();
  const user = request.user;

  if (!user) throw new CustomHttpException(DomainExceptionCode.UNAUTHORIZED, 'User not found in request');
  return data ? user[data] : user;
});
