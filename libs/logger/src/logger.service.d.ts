import { ConsoleLogger } from '@nestjs/common';
import { WinstonService } from './winston.service';
export declare class LoggerService extends ConsoleLogger {
    private winstonLogger;
    constructor(winstonLogger: WinstonService);
    log(message: string): void;
    error(message: string, stack?: string): void;
    setContext(context: string): void;
}
