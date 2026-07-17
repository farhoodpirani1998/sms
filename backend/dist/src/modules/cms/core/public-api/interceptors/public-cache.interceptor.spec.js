"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const public_cache_interceptor_1 = require("./public-cache.interceptor");
function fakeSite(overrides = {}) {
    return {
        id: 'site-1',
        name: 'NHG',
        domain: 'nhg.example.com',
        defaultLocale: 'en',
        supportedLocales: ['en'],
        theme: null,
        socialLinks: null,
        seoDefaults: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
function fakeRedis(overrides = {}) {
    return {
        get: overrides.get ?? jest.fn().mockResolvedValue(null),
        set: overrides.set ?? jest.fn().mockResolvedValue('OK'),
    };
}
function fakeLocaleResolver(locale = 'en') {
    return { resolve: jest.fn().mockResolvedValue(locale) };
}
function fakeContext(request) {
    return {
        switchToHttp: () => ({ getRequest: () => request }),
    };
}
function fakeCallHandler(payload) {
    return { handle: jest.fn().mockReturnValue((0, rxjs_1.of)(payload)) };
}
async function firstValue(observable) {
    return new Promise((resolve) => {
        observable.subscribe((value) => resolve(value));
    });
}
describe('PublicCacheInterceptor', () => {
    it('passes non-GET requests through without touching Redis', async () => {
        const redis = fakeRedis();
        const interceptor = new public_cache_interceptor_1.PublicCacheInterceptor(redis, fakeLocaleResolver());
        const request = {
            method: 'POST',
            cmsSite: fakeSite(),
            query: {},
            originalUrl: '/api/public/hero',
        };
        const next = fakeCallHandler({ ok: true });
        const result = await interceptor.intercept(fakeContext(request), next);
        expect(await firstValue(result)).toEqual({ ok: true });
        expect(next.handle).toHaveBeenCalled();
        expect(redis.get).not.toHaveBeenCalled();
    });
    it('passes requests through uncached when no Site was resolved', async () => {
        const redis = fakeRedis();
        const interceptor = new public_cache_interceptor_1.PublicCacheInterceptor(redis, fakeLocaleResolver());
        const request = { method: 'GET', query: {}, originalUrl: '/api/public/hero' };
        const next = fakeCallHandler({ ok: true });
        await interceptor.intercept(fakeContext(request), next);
        expect(next.handle).toHaveBeenCalled();
        expect(redis.get).not.toHaveBeenCalled();
    });
    it('on a cache miss, calls the handler and writes the response with the floor TTL', async () => {
        const redis = fakeRedis({ get: jest.fn().mockResolvedValue(null) });
        const localeResolver = fakeLocaleResolver('en');
        const interceptor = new public_cache_interceptor_1.PublicCacheInterceptor(redis, localeResolver);
        const request = {
            method: 'GET',
            cmsSite: fakeSite({ id: 'site-1' }),
            query: {},
            originalUrl: '/api/public/hero',
        };
        const next = fakeCallHandler({ title: 'Welcome' });
        const result = await interceptor.intercept(fakeContext(request), next);
        expect(await firstValue(result)).toEqual({ title: 'Welcome' });
        await new Promise((resolve) => setImmediate(resolve));
        const expectedKey = (0, public_cache_interceptor_1.buildPublicCacheKey)('site-1', 'en', '/api/public/hero');
        expect(redis.get).toHaveBeenCalledWith(expectedKey);
        expect(redis.set).toHaveBeenCalledWith(expectedKey, JSON.stringify({ title: 'Welcome' }), 'EX', public_cache_interceptor_1.PUBLIC_CACHE_TTL_SECONDS);
    });
    it('on a cache hit, returns the cached value and never calls the handler', async () => {
        const cachedBody = JSON.stringify({ title: 'Cached' });
        const redis = fakeRedis({ get: jest.fn().mockResolvedValue(cachedBody) });
        const interceptor = new public_cache_interceptor_1.PublicCacheInterceptor(redis, fakeLocaleResolver('en'));
        const request = {
            method: 'GET',
            cmsSite: fakeSite({ id: 'site-1' }),
            query: {},
            originalUrl: '/api/public/hero',
        };
        const next = fakeCallHandler({ title: 'Should not be used' });
        const result = await interceptor.intercept(fakeContext(request), next);
        expect(await firstValue(result)).toEqual({ title: 'Cached' });
        expect(next.handle).not.toHaveBeenCalled();
    });
    it('resolves the cache key locale through LocaleResolverService using the request query', async () => {
        const redis = fakeRedis();
        const localeResolver = fakeLocaleResolver('fa');
        const interceptor = new public_cache_interceptor_1.PublicCacheInterceptor(redis, localeResolver);
        const request = {
            method: 'GET',
            cmsSite: fakeSite({ id: 'site-1' }),
            query: { locale: 'fa' },
            originalUrl: '/api/public/hero?locale=fa',
        };
        const next = fakeCallHandler({ ok: true });
        await interceptor.intercept(fakeContext(request), next);
        expect(localeResolver.resolve).toHaveBeenCalledWith('site-1', 'fa');
        expect(redis.get).toHaveBeenCalledWith((0, public_cache_interceptor_1.buildPublicCacheKey)('site-1', 'fa', '/api/public/hero'));
    });
    it('treats a Redis read failure as a cache miss rather than failing the request', async () => {
        const redis = fakeRedis({ get: jest.fn().mockRejectedValue(new Error('down')) });
        const interceptor = new public_cache_interceptor_1.PublicCacheInterceptor(redis, fakeLocaleResolver());
        const request = {
            method: 'GET',
            cmsSite: fakeSite({ id: 'site-1' }),
            query: {},
            originalUrl: '/api/public/hero',
        };
        const next = fakeCallHandler({ ok: true });
        const result = await interceptor.intercept(fakeContext(request), next);
        expect(await firstValue(result)).toEqual({ ok: true });
        expect(next.handle).toHaveBeenCalled();
    });
});
//# sourceMappingURL=public-cache.interceptor.spec.js.map