import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { AsyncLocalStorageService } from './async-local-storage/async-local-storage.service';
import { RequestContextMiddleware } from './middleware/request-context.middleware';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [LoggerService, AsyncLocalStorageService, RequestContextMiddleware],
  exports: [LoggerService, AsyncLocalStorageService],
})
export class LoggerModule {}
