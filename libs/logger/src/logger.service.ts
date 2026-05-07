import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import { WinstonService } from './winston.service';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  constructor(private winstonLogger: WinstonService) {
    super();
  }

  log(message: string) {
    this.winstonLogger.log(message, this.context);
    super.log(message);
  }

  error(message: string, stack?: string) {
    this.winstonLogger.error(message, stack);
    super.error(message, stack);
  }

  setContext(context: string) {
    this.winstonLogger.setContext(context);
    super.setContext(context);
  }
}
