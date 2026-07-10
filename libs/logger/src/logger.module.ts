import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { WinstonService } from './winston.service';
import { AsyncLocalStorageService } from './async-local-storage';
import { RequestContextMiddleware } from './middleware';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [WinstonService, LoggerService, AsyncLocalStorageService, RequestContextMiddleware],
  exports: [LoggerService, AsyncLocalStorageService],
})
export class LoggerModule {}
