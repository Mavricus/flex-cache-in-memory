import { IFlexCache } from '@flex-cache/types';

interface ICacheScope {
    timer?: NodeJS.Timer;
    data: unknown;
}

export class FlexInMemoryCache implements IFlexCache {
    constructor(private storage: { [key: string]: ICacheScope }) {
    }

    delete<T>(name: string): Promise<void> {
        const scope = this.storage[name];
        if (scope != null && scope.timer != null) {
            clearTimeout(scope.timer);
        }

        delete this.storage[name];
        return Promise.resolve();
    }

    get<T>(name: string): Promise<T | null> {
        const data = this.storage[name] != null ? this.storage[name].data : null;
        return Promise.resolve(data as T);
    }

    setForce<T>(name: string, data: T, ttl: number): Promise<void> {
        if (ttl <= 0) {
            return Promise.reject(new Error('TTL must be a positive number'));
        }
        let newScope: ICacheScope = { data };
        if (ttl !== Infinity) {
            newScope.timer = setTimeout(() => this.delete(name), ttl);
        }

        return this.delete(name)
                   .then(() => {
                       this.storage[name] = newScope;
                   });
    }

    set<T>(name: string, data: T, ttl: number): Promise<void> {
        if (this.storage[name] != null) {
            return Promise.reject(new Error('Cache already exists'));
        }
        return this.setForce(name, data, ttl);
    }

    update<T>(name: string, data: T, ttl: number): Promise<void> {
        if (this.storage[name] == null) {
            return Promise.reject(new Error('Cache does not exist'));
        }
        return this.setForce(name, data, ttl);
    }
}
