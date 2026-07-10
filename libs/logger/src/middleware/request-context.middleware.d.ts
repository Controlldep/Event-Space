import { NestMiddleware } from '@nestjs/common';
import { AsyncLocalStorageService } from '../async-local-storage/async-local-storage.service';
import { NextFunction, Request, Response } from 'express';
export declare const REQUEST_ID_KEY = "requestId";
export declare class RequestContextMiddleware implements NestMiddleware {
    private asyncLocalStorageService;
    constructor(asyncLocalStorageService: AsyncLocalStorageService);
    use(req: Request, res: Response, next: NextFunction): void;
}
