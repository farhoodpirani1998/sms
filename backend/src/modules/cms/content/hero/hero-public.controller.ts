import { Controller, Get, Query } from '@nestjs/common';
import { HeroService } from './hero.service';
import { PublicHeroQueryDto } from './dto/hero-query.dto';

/**
 * `cms/public/hero` — CMS-D.1. Public read endpoint: every `PUBLISHED`
 * Hero row for a Site, localized. Deliberately unguarded (no auth — this
 * is public-facing website content) and uncached — per the roadmap,
 * `PublicSiteContextGuard` (Host-header Site resolution, replacing this
 * endpoint's `?siteId=` query param) and `PublicCacheInterceptor` both
 * land in CMS-I, once all 14 content types' public controllers exist to
 * wire them into at once. Until then, every `content/*` public
 * controller (this one included) takes `siteId` directly as a query
 * param, same stopgap `SiteResolverService`'s CMS-A.3 doc comment
 * already flags for the admin side.
 */
@Controller('cms/public/hero')
export class HeroPublicController {
  constructor(private readonly heroService: HeroService) {}

  @Get()
  async findPublished(@Query() query: PublicHeroQueryDto) {
    return this.heroService.findPublished(query.siteId, query.locale);
  }
}
