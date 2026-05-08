import { CallHandler, ExecutionContext, HttpStatus, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { CustomHttpException, DomainExceptionCode } from '../exceptions/domain.exceptions';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        this.log(method, url, response.statusCode, now);
      }),
      catchError((err) => {
        let statusCode: number;

        if (err instanceof CustomHttpException) {
          statusCode = this.mapDomainToHttp(err.code);
        } else if (typeof err.getStatus === 'function') {
          statusCode = err.getStatus();
        } else {
          statusCode = err.status || 500;
        }

        this.log(method, url, statusCode, now);
        return throwError(() => err);
      }),
    );
  }

  private mapDomainToHttp(code: DomainExceptionCode): number {
    const mapping: Record<DomainExceptionCode, number> = {
      [DomainExceptionCode.BAD_REQUEST]: HttpStatus.BAD_REQUEST,
      [DomainExceptionCode.FORBIDDEN]: HttpStatus.FORBIDDEN,
      [DomainExceptionCode.NOT_FOUND]: HttpStatus.NOT_FOUND,
      [DomainExceptionCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
      [DomainExceptionCode.INTERNAL_SERVER_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
      [DomainExceptionCode.TOO_MANY_REQUESTS]: HttpStatus.TOO_MANY_REQUESTS,
    };
    return mapping[code] || HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private log(method: string, url: string, statusCode: number, startTime: number) {
    const delay = Date.now() - startTime;
    const message = `${method} ${url} ${statusCode} +${delay}ms`;

    if (statusCode >= 500) this.logger.error(message);
    else if (statusCode >= 400) this.logger.warn(message);
    else this.logger.log(message);
  }
}
