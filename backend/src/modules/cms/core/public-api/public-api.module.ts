import { Module } from '@nestjs/common';
import { SiteModule } from '../site/site.module';
import { PublicSiteContextGuard } from './guards/public-site-context.guard';

/**
 * CMS-I.1 — first slice of `core/public-api`. Imports `SiteModule` only
 * for `SiteResolverService` (already exported from CMS-A.2) and provides
 * `PublicSiteContextGuard`, exported so any public controller can
 * `@UseGuards(PublicSiteContextGuard)` once CMS-I.3–I.5 wire it in.
 *
 * `PublicCacheInterceptor` and the cache-invalidation listener (CMS-I.2)
 * land in this module next, followed by the actual per-controller wiring
 * — this module is the shared home for all of CMS-I's public-API
 * plumbing, same role `RevisionsModule`/`PublishingModule` play for
 * their respective concerns.
 */
@Module({
  imports: [SiteModule],
  providers: [PublicSiteContextGuard],
  exports: [PublicSiteContextGuard],
})
export class PublicApiModule {}
