import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import {
  PublicCacheInterceptor,
  PUBLIC_CACHE_TTL_SECONDS,
  buildPublicCacheKey,
} from './public-cache.interceptor';
import { Site } from '../../site/entities/site.entity';

function fakeSite(overrides: Partial<Site> = {}): Site {
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

function fakeRedis(overrides: Partial<Record<'get' | 'set', jest.Mock>> = {}) {
  return {
    get: overrides.get ?? jest.fn().mockResolvedValue(null),
    set: overrides.set ?? jest.fn().mockResolvedValue('OK'),
  } as any;
}

function fakeLocaleResolver(locale = 'en') {
  return { resolve: jest.fn().mockResolvedValue(locale) } as any;
}

function fakeContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function fakeCallHandler(payload: unknown): CallHandler {
  return { handle: jest.fn().mockReturnValue(of(payload)) };
}

async function firstValue(observable: Observable<unknown>): Promise<unknown> {
  return new Promise((resolve) => {
    observable.subscribe((value) => resolve(value));
  });
}

describe('PublicCacheInterceptor', () => {
  it('passes non-GET requests through without touching Redis', async () => {
    const redis = fakeRedis();
    const interceptor = new PublicCacheInterceptor(redis, fakeLocaleResolver());
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
    const interceptor = new PublicCacheInterceptor(redis, fakeLocaleResolver());
    const request = { method: 'GET', query: {}, originalUrl: '/api/public/hero' };
    const next = fakeCallHandler({ ok: true });

    await interceptor.intercept(fakeContext(request), next);

    expect(next.handle).toHaveBeenCalled();
    expect(redis.get).not.toHaveBeenCalled();
  });

  it('on a cache miss, calls the handler and writes the response with the floor TTL', async () => {
    const redis = fakeRedis({ get: jest.fn().mockResolvedValue(null) });
    const localeResolver = fakeLocaleResolver('en');
    const interceptor = new PublicCacheInterceptor(redis, localeResolver);
    const request = {
      method: 'GET',
      cmsSite: fakeSite({ id: 'site-1' }),
      query: {},
      originalUrl: '/api/public/hero',
    };
    const next = fakeCallHandler({ title: 'Welcome' });

    const result = await interceptor.intercept(fakeContext(request), next);
    expect(await firstValue(result)).toEqual({ title: 'Welcome' });

    // tap() runs synchronously on emission, but the write itself is
    // fire-and-forget (`void this.safeSet(...)`) -- flush microtasks.
    await new Promise((resolve) => setImmediate(resolve));

    const expectedKey = buildPublicCacheKey('site-1', 'en', '/api/public/hero');
    expect(redis.get).toHaveBeenCalledWith(expectedKey);
    expect(redis.set).toHaveBeenCalledWith(
      expectedKey,
      JSON.stringify({ title: 'Welcome' }),
      'EX',
      PUBLIC_CACHE_TTL_SECONDS,
    );
  });

  it('on a cache hit, returns the cached value and never calls the handler', async () => {
    const cachedBody = JSON.stringify({ title: 'Cached' });
    const redis = fakeRedis({ get: jest.fn().mockResolvedValue(cachedBody) });
    const interceptor = new PublicCacheInterceptor(redis, fakeLocaleResolver('en'));
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
    const interceptor = new PublicCacheInterceptor(redis, localeResolver);
    const request = {
      method: 'GET',
      cmsSite: fakeSite({ id: 'site-1' }),
      query: { locale: 'fa' },
      originalUrl: '/api/public/hero?locale=fa',
    };
    const next = fakeCallHandler({ ok: true });

    await interceptor.intercept(fakeContext(request), next);

    expect(localeResolver.resolve).toHaveBeenCalledWith('site-1', 'fa');
    expect(redis.get).toHaveBeenCalledWith(
      buildPublicCacheKey('site-1', 'fa', '/api/public/hero'),
    );
  });

  it('treats a Redis read failure as a cache miss rather than failing the request', async () => {
    const redis = fakeRedis({ get: jest.fn().mockRejectedValue(new Error('down')) });
    const interceptor = new PublicCacheInterceptor(redis, fakeLocaleResolver());
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
