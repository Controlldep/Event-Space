import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomHttpException, DomainExceptionCode } from '@app/exceptions';

const TRUSTED_SERVICES = new Set(['events', 'tickets']);

@Injectable()
export class PaymentsJwtGuard extends AuthGuard('jwt') {
  handleRequest(err, user) {
    if (err || !user || !TRUSTED_SERVICES.has(user.service)) {
      throw new CustomHttpException(DomainExceptionCode.UNAUTHORIZED);
    }
    return user;
  }
}
