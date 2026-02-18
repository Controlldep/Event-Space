import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected getTrackerKey(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();
    return `${request.ip}:${request.route.path}`;
  }
}
