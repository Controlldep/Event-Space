import { Injectable } from '@nestjs/common';
import winston from 'winston';
import { REQUEST_ID_KEY } from '@app/logger/middleware';
import { AsyncLocalStorageService } from '@app/logger/async-local-storage';

@Injectable()
export class WinstonService {
  private logger: winston.Logger;
  private context: string = 'App';

  constructor(private readonly asyncLocalStorageService: AsyncLocalStorageService) {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      levels: winston.config.npm.levels,
      transports: [
        new winston.transports.Console({
          format: winston.format.colorize({ all: true }),
        }),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
      ],
    });
  }

  log(message: string, context?: string) {
    const store = this.asyncLocalStorageService.getStore();
    const requestId = store?.get(REQUEST_ID_KEY);

    this.logger.info(message, {
      context: context || this.context,
      requestId: requestId,
    });
  }

  error(message: string, stack?: string) {
    this.logger.error(message, { stack });
  }

  setContext(context: string) {
    this.context = context;
  }
}
