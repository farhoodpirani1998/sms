import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
  OnModuleDestroy,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import Redis from 'ioredis';
import { LocaleResolverService } from '../../../common/services/locale-resolver.service';
import { RequestWithCmsSite } from '../guards/public-site-context.guard';

export const PUBLIC_CACHE_REDIS = Symbol('PUBLIC_CACHE_REDIS');

export const PUBLIC_CACHE_KEY_PREFIX = 'cms:public';

// "Short TTL floor" per the roadmap: public content changes via
// publish/unpublish/update, all of which actively clear the affected
// Site's keys (see CacheInvalidationListener) — this TTL is only a
// backstop for the gap between a write and the listener running, not
// the primary invalidation mechanism, so it deliberately stays short.
export const PUBLIC_CACHE_TTL_SECONDS = 60;

export function buildPublicCacheKey(siteId: string, locale: string, route: string): string {
  return `${PUBLIC_CACHE_KEY_PREFIX}:${siteId}:${locale}:${route}`;
}

// Used by CacheInvalidationListener: it doesn't know which specific
// locale/route combos are cached for a Site, so it clears everything
// under this Site's prefix rather than computing the exact key.
export function buildPublicCacheSitePattern(siteId: string): string {
  return `${PUBLIC_CACHE_KEY_PREFIX}:${siteId}:*`;
}

/**
 * Dedicated ioredis client for public-cache reads/writes — same "own
 * connection, not reused from BullMQ" reasoning as
 * `RedisHealthIndicator` (src/modules/health), since this is plain
 * GET/SET/SCAN/DEL traffic, not BullMQ job processing. `PublicApiModule`
 * registers this factory's return value under the `PUBLIC_CACHE_REDIS`
 * token so `PublicCacheInterceptor` and `CacheInvalidationListener`
 * share one connection.
 *
 * Attaching `onModuleDestroy` directly onto the returned client (rather
 * than wrapping it in its own provider class) works because Nest checks
 * every instance in the DI container for lifecycle-hook methods
 * regardless of whether it came from a class or a factory.
 */
export function createPublicCacheRedisClient(): Redis {
  const client = new Redis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
  });

  // Without a listener, ioredis's 'error' event would be unhandled and
  // crash the process; failures are already handled per-call in
  // PublicCacheInterceptor/CacheInvalidationListener instead.
  client.on('error', () => undefined);

  (client as unknown as OnModuleDestroy).onModuleDestroy = async () => {
    client.disconnect();
  };

  return client;
}

/**
 * CMS-I.2. Caches public GET responses in Redis, keyed
 * `cms:public:{siteId}:{locale}:{route}` per the roadmap. Not yet applied
 * to any controller — CMS-I.3–I.5 pair it with `PublicSiteContextGuard`
 * on each public controller group.
 *
 * Scope is deliberately narrow:
 * - Only `GET` requests are cached; anything else passes through.
 * - Requires `request.cmsSite` (set by `PublicSiteContextGuard`, which
 *   must run first) — with no Site resolved there's nothing to scope
 *   the key by, so the request just passes through uncached rather than
 *   guessing a key.
 * - A Redis failure (read or write) is logged and treated as a cache
 *   miss / no-op write — a cache outage must never turn into a public
 *   API outage.
 */
@Injectable()
export class PublicCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PublicCacheInterceptor.name);

  constructor(
    @Inject(PUBLIC_CACHE_REDIS) private readonly redis: Redis,
    private readonly localeResolver: LocaleResolverService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<RequestWithCmsSite>();

    if (request.method !== 'GET') {
      return next.handle();
    }

    const siteId = request.cmsSite?.id;
    if (!siteId) {
      return next.handle();
    }

    const key = await this.buildKey(request, siteId);

    const cached = await this.safeGet(key);
    if (cached !== null) {
      return of(JSON.parse(cached));
    }

    return next.handle().pipe(
      tap((body) => {
        void this.safeSet(key, body);
      }),
    );
  }

  private async buildKey(request: RequestWithCmsSite, siteId: string): Promise<string> {
    const requestedLocale = this.firstString((request.query as Record<string, unknown>)?.locale);
    const locale = await this.localeResolver.resolve(siteId, requestedLocale ?? null);
    const route = (request.originalUrl ?? request.url).split('?')[0];
    return buildPublicCacheKey(siteId, locale, route);
  }

  private firstString(value: unknown): string | undefined {
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    return undefined;
  }

  private async safeGet(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      this.logger.warn(`Public cache read failed for "${key}": ${(error as Error).message}`);
      return null;
    }
  }

  private async safeSet(key: string, body: unknown): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(body), 'EX', PUBLIC_CACHE_TTL_SECONDS);
    } catch (error) {
      this.logger.warn(`Public cache write failed for "${key}": ${(error as Error).message}`);
    }
  }
}
