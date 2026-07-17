import { Module } from '@nestjs/common';
import { SiteModule } from '../site/site.module';
import { PublicSiteContextGuard } from './guards/public-site-context.guard';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import {
  PUBLIC_CACHE_REDIS,
  PublicCacheInterceptor,
  createPublicCacheRedisClient,
} from './interceptors/public-cache.interceptor';
import { CacheInvalidationListener } from './listeners/cache-invalidation.listener';

/**
 * CMS-I.1 — first slice of `core/public-api`. Imports `SiteModule` only
 * for `SiteResolverService` (already exported from CMS-A.2) and provides
 * `PublicSiteContextGuard`, exported so any public controller can
 * `@UseGuards(PublicSiteContextGuard)` once CMS-I.3–I.5 wire it in.
 *
 * CMS-I.2 adds the rest of this module's plumbing:
 * - `LocaleResolverService` (CMS-C.3, not registered anywhere until now
 *   — see its own doc comment) is provided here since
 *   `PublicCacheInterceptor` is its first real consumer, needing it to
 *   fold a request's `?locale=` into the Site's actual supported locale
 *   for the cache key.
 * - `PUBLIC_CACHE_REDIS` is a dedicated ioredis client (own connection,
 *   not BullMQ's — see `createPublicCacheRedisClient`'s doc comment),
 *   shared by `PublicCacheInterceptor` and `CacheInvalidationListener`
 *   so both read/write/invalidate the same keyspace.
 * - `CacheInvalidationListener` has no exports of its own to offer (it's
 *   a pure `@OnEvent` subscriber) but must be instantiated for Nest to
 *   register its event handlers, so it's listed under `providers` only.
 *
 * Per the roadmap, `PublicCacheInterceptor` is proven here in isolation
 * — not yet applied to any public controller. That + the guard's actual
 * wiring both land per content-group in CMS-I.3–I.5.
 */
@Module({
  imports: [SiteModule],
  providers: [
    PublicSiteContextGuard,
    LocaleResolverService,
    { provide: PUBLIC_CACHE_REDIS, useFactory: createPublicCacheRedisClient },
    PublicCacheInterceptor,
    CacheInvalidationListener,
  ],
  exports: [PublicSiteContextGuard, PublicCacheInterceptor, PUBLIC_CACHE_REDIS, LocaleResolverService],
})
export class PublicApiModule {}
