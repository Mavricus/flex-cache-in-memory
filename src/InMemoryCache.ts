import { ICacheController } from '@flex-cache/types';

export class InMemoryCache implements ICacheController {
    private storage: { [key: string]: unknown } = {};

    delete<T>(name: string): Promise<void> {
        delete this.storage[name];
        return Promise.resolve();
    }

    get<T>(name: string): Promise<T> {
        return Promise.resolve(this.storage[name]);
    }

    set<T>(name: string, data: T, ttl: number): Promise<void> {
        this.storage[name] = data;
        return Promise.resolve();
    }

}
