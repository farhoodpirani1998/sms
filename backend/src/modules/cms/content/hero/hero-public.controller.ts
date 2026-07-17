import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { HeroService } from './hero.service';
import { PublicHeroQueryDto } from './dto/hero-query.dto';
import { PublicSiteContextGuard } from '../../core/public-api/guards/public-site-context.guard';
import { PublicCacheInterceptor } from '../../core/public-api/interceptors/public-cache.interceptor';
import { PublicSiteContext } from '../../common/decorators/public-site-context.decorator';
import { Site } from '../../core/site/entities/site.entity';

/**
 * `public/hero` — CMS-D wired for CMS-I.3. Public read
 * endpoint: every `PUBLISHED` Hero row for a Site, localized.
 * Deliberately unauthenticated (this is public-facing website content),
 * but now Site-scoped via `PublicSiteContextGuard` (Host-header
 * resolution, with the CMS-A.3/I.1 dev slug fallback) instead of the
 * old `?siteId=` query param, and cached by `PublicCacheInterceptor`
 * per the roadmap's CMS-I.2/I.3 pairing.
 */
@Controller('public/hero')
@UseGuards(PublicSiteContextGuard)
@UseInterceptors(PublicCacheInterceptor)
export class HeroPublicController {
  constructor(private readonly heroService: HeroService) {}

  @Get()
  async findPublished(@PublicSiteContext() site: Site, @Query() query: PublicHeroQueryDto) {
    return this.heroService.findPublished(site.id, query.locale);
  }
}
