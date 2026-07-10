export declare class AsyncLocalStorageService {
    private asyncLocalStorage;
    start(callback: () => void): void;
    getStore(): Map<string, any> | undefined;
}
