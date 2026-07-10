import { AsyncLocalStorageService } from './async-local-storage';
export declare class WinstonService {
    private readonly asyncLocalStorageService;
    private logger;
    private context;
    constructor(asyncLocalStorageService: AsyncLocalStorageService);
    log(message: string, context?: string): void;
    error(message: string, stack?: string): void;
    setContext(context: string): void;
}
