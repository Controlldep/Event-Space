export class CustomHttpException extends Error {
  constructor(
    public readonly code: DomainExceptionCode,
    message?: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = 'CustomHttpException';
  }
}

export enum DomainExceptionCode {
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  FORBIDDEN = 'FORBIDDEN',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
}
