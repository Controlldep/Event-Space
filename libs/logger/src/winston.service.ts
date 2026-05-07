import { Injectable } from '@nestjs/common';
import winston from 'winston';

@Injectable()
export class WinstonService {
  private logger: winston.Logger;
  private context: string = 'App';

  constructor() {
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
    this.logger.info(message, { context: context || this.context });
  }

  error(message: string, stack?: string) {
    this.logger.error(message, { stack });
  }

  setContext(context: string) {
    this.context = context;
  }
}
