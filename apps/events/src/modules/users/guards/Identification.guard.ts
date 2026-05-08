import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CustomHttpException, DomainExceptionCode } from '../../../core/exceptions/domain.exceptions';

@Injectable()
export class IdentificationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userAgent = request.headers['user-agent'];
    const deviceId = request.headers['x-device-id'];

    if (!userAgent && !deviceId) {
      throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'Security check failed: User-Agent and Device-ID are required');
    }

    return true;
  }
}
