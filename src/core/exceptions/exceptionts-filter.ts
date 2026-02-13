import { CustomHttpException, DomainExceptionCode } from './domain.exceptions';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  ValidationError,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(CustomHttpException)
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: CustomHttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse<Response>();

    const status: DomainExceptionCode = exception.code;

    switch (status) {
      case DomainExceptionCode.UNAUTHORIZED:
      case DomainExceptionCode.FORBIDDEN:
      case DomainExceptionCode.NOT_FOUND:
      case DomainExceptionCode.TOO_MANY_REQUESTS:
        return response.status(this.mapToHttpStatus(status)).send();
    }
    if (status === DomainExceptionCode.BAD_REQUEST) {
      // const errors = exception.details.map((error: ValidationError) => ({
      //   message: error.constraints
      //     ? Object.values(error.constraints)[0]
      //     : 'Invalid value',
      //   field: error.property,
      // }));
      // return response.status(HttpStatus.BAD_REQUEST).json({
      //   errorsMessages: errors,
      // });
      const errors = exception.details
        ? exception.details.map((error: any) => ({
            message: error.constraints
              ? Object.values(error.constraints)[0]
              : 'Invalid value',
            field: error.property,
          }))
        : [{ message: exception.message || 'Domain error', field: 'logic' }]; // Дефолтный вариант

      return response.status(HttpStatus.BAD_REQUEST).json({
        errorsMessages: errors,
      });
    }
  }

  private mapToHttpStatus(code: DomainExceptionCode): number {
    switch (code) {
      case DomainExceptionCode.BAD_REQUEST:
        return HttpStatus.BAD_REQUEST;
      case DomainExceptionCode.FORBIDDEN:
        return HttpStatus.FORBIDDEN;
      case DomainExceptionCode.NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      case DomainExceptionCode.UNAUTHORIZED:
        return HttpStatus.UNAUTHORIZED;
      case DomainExceptionCode.INTERNAL_SERVER_ERROR:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      case DomainExceptionCode.TOO_MANY_REQUESTS:
        return HttpStatus.TOO_MANY_REQUESTS;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}
