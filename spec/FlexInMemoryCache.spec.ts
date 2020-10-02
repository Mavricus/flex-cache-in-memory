import { FlexInMemoryCache } from '../src/FlexInMemoryCache';

describe('InMemoryCache', () => {
    let cache: FlexInMemoryCache;
    let storage: { [key: string]: { timer: NodeJS.Timer; data: unknown } };

    beforeAll(() => {
        jest.useFakeTimers();
    });

    beforeEach(() => {
        storage = {};
        cache = new FlexInMemoryCache(storage);
    });

    afterEach(() => {
        jest.runAllTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    describe('set', () => {
        it('should assign the value to the key',  () => {
            return cache.set('a', 123, 5000)
                        .then(() => expect(storage['a'].data).toBe(123));
        });

        it('should reject with error if cache already exists',  () => {
            return cache.set('a', 123, 5000)
                        .then(() => expect(storage['a'].data).toBe(123))
                        .then(() => expect(cache.set('a', 321, 5000)).rejects.toThrowError());
        });

        it('should re-assign the value to the key after timeout',  () => {
            return cache.set('a', 123, 5000)
                        .then(() => expect(storage['a'].data).toBe(123))
                        .then(() => jest.runAllTimers())
                        .then(() => cache.set('a', 321, 5000))
                        .then(() => expect(storage['a'].data).toBe(321));
        });

        it('should reject with error when TTL is negative',  () => {
            return expect(cache.set('a', 123, -5000)).rejects.toThrowError();
        });

        it('should reject with error when TTL is 0',  () => {
            return expect(cache.set('a', 123, 0)).rejects.toThrowError();
        });
    });

    describe('delete', () => {
        it('should delete data from the cache by key', () => {
            return cache.set('a', 123, 5000)
                        .then(() => expect(storage['a'].data).toBe(123))
                        .then(() => cache.delete('a'))
                        .then(() => expect(storage['a']).toBeUndefined());
        });
        it('should delete data from the cache by key', () => {
            return Promise.resolve(expect(storage['a']).toBeUndefined())
                          .then(() => expect(cache.delete('a')).resolves.toBeFalsy());
        });
    });

    describe('get', () => {
        it('should return data from the cache by key', () => {
            return cache.set('a', 123, 5000)
                        .then(() => expect(storage['a'].data).toBe(123))
                        .then(() => expect(cache.get('a')).resolves.toBe(123));
        });
        it('should return null if there is no data by key', () => {
            return Promise.resolve(expect(storage['a']).toBeUndefined())
                          .then(() => expect(cache.get('a')).resolves.toBeNull());
        });
    });

    describe('setForce', () => {
        it('should assign the value to the key',  () => {
            return cache.setForce('a', 123, 5000)
                        .then(() => expect(storage['a'].data).toBe(123));
        });

        it('should rewrite cache if already exists',  () => {
            return cache.setForce('a', 123, 5000)
                        .then(() => expect(storage['a'].data).toBe(123))
                        .then(() => cache.setForce('a', 321, 5000))
                        .then(() => expect(storage['a'].data).toBe(321));
        });

        it('should re-assign the value to the key after timeout',  () => {
            return cache.setForce('a', 123, 5000)
                        .then(() => expect(storage['a'].data).toBe(123))
                        .then(() => jest.runAllTimers())
                        .then(() => cache.setForce('a', 321, 5000))
                        .then(() => expect(storage['a'].data).toBe(321));
        });

        it('should reject with error when TTL is negative',  () => {
            return expect(cache.setForce('a', 123, -5000)).rejects.toThrowError();
        });

        it('should reject with error when TTL is 0',  () => {
            return expect(cache.setForce('a', 123, 0)).rejects.toThrowError();
        });
    });

    describe('setForce', () => {
        it('should update the cache by key',  () => {
            return cache.setForce('a', 123, 5000)
                        .then(() => expect(storage['a'].data).toBe(123))
                        .then(() => cache.update('a', 321, 5000))
                        .then(() => expect(storage['a'].data).toBe(321));
        });

        it('should reject wit an error if cache does not exist',  () => {
            return expect(cache.get('a')).resolves.toBeNull()
                        .then(() => expect(cache.update('a', 123, 5000)).rejects.toThrowError());
        });

        it('should reject with error when TTL is negative',  () => {
            return expect(cache.update('a', 123, -5000)).rejects.toThrowError();
        });

        it('should reject with error when TTL is 0',  () => {
            return expect(cache.update('a', 123, 0)).rejects.toThrowError();
        });
    });

    describe('timeout', () => {
        it('should delete data on timeout', () => {
            return cache.set('a', 123, 5000)
                        .then(() => expect(cache.get('a')).resolves.toBe(123))
                        .then(() => jest.advanceTimersByTime(5000))
                        .then(() => expect(cache.get('a')).resolves.toBeNull())
        });
        it('should delete data on timeout of very last set', () => {
            return cache.set('a', 123, 5000)
                        .then(() => expect(cache.get('a')).resolves.toBe(123))
                        .then(() => jest.advanceTimersByTime(3000))
                        .then(() => cache.setForce('a', 456, 5000))
                        .then(() => expect(cache.get('a')).resolves.toBe(456))
                        .then(() => jest.advanceTimersByTime(3000))
                        .then(() => expect(cache.get('a')).resolves.toBe(456))
                        .then(() => jest.advanceTimersByTime(2000))
                        .then(() => expect(cache.get('a')).resolves.toBeNull());
        });
        it('should delete data on its personal timeout', () => {
            return cache.set('a', 123, 5000)
                        .then(() => cache.set('b', 456, 2500))
                        .then(() => jest.advanceTimersByTime(2000))
                        .then(() => expect(cache.get('a')).resolves.toBe(123))
                        .then(() => expect(cache.get('b')).resolves.toBe(456))
                        .then(() => jest.advanceTimersByTime(2000))
                        .then(() => expect(cache.get('a')).resolves.toBe(123))
                        .then(() => expect(cache.get('b')).resolves.toBeNull())
                        .then(() => jest.advanceTimersByTime(2000))
                        .then(() => expect(cache.get('a')).resolves.toBeNull())
                        .then(() => expect(cache.get('b')).resolves.toBeNull());
        });
        it('should stop timer if data was deleted', () => {
            return cache.set('a', 123, 5000)
                        .then(() => jest.advanceTimersByTime(2000))
                        .then(() => cache.delete('a'))
                        .then(() => jest.advanceTimersByTime(2000))
                        .then(() => cache.set('a', 456, 5000))
                        .then(() => jest.advanceTimersByTime(2000))
                        .then(() => expect(cache.get('a')).resolves.toBe(456))
                        .then(() => jest.advanceTimersByTime(5000))
                        .then(() => expect(cache.get('a')).resolves.toBeNull());
        });
        it('should not delete cached data when ttl is Infinity', () => {
            return cache.set('a', 123, Infinity)
                        .then(() => cache.set('b', 456, 2500))
                        .then(() => jest.runAllTimers())
                        .then(() => expect(cache.get('a')).resolves.toBe(123))
                        .then(() => expect(cache.get('b')).resolves.toBeNull());
        });
        it('should reset timer after update', () => {
            return cache.set('a', 123, 5000)
                        .then(() => expect(cache.get('a')).resolves.toBe(123))
                        .then(() => jest.advanceTimersByTime(3000))
                        .then(() => cache.update('a', 321, 5000))
                        .then(() => expect(cache.get('a')).resolves.toBe(321))
                        .then(() => jest.advanceTimersByTime(3000))
                        .then(() => expect(cache.get('a')).resolves.toBe(321))
                        .then(() => jest.advanceTimersByTime(3000))
                        .then(() => expect(cache.get('a')).resolves.toBeNull());
        });
    });
});
