import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AboutService } from './about.service';
import { PublicAboutQueryDto } from './dto/about-query.dto';
import { PublicSiteContextGuard } from '../../core/public-api/guards/public-site-context.guard';
import { PublicCacheInterceptor } from '../../core/public-api/interceptors/public-cache.interceptor';
import { PublicSiteContext } from '../../common/decorators/public-site-context.decorator';
import { Site } from '../../core/site/entities/site.entity';

/**
 * `public/about` — CMS-D wired for CMS-I.3. Public read
 * endpoint: every `PUBLISHED` About row for a Site, localized.
 * Deliberately unauthenticated (this is public-facing website content),
 * but now Site-scoped via `PublicSiteContextGuard` (Host-header
 * resolution, with the CMS-A.3/I.1 dev slug fallback) instead of the
 * old `?siteId=` query param, and cached by `PublicCacheInterceptor`
 * per the roadmap's CMS-I.2/I.3 pairing.
 */
@Controller('public/about')
@UseGuards(PublicSiteContextGuard)
@UseInterceptors(PublicCacheInterceptor)
export class AboutPublicController {
  constructor(private readonly aboutService: AboutService) {}

  @Get()
  async findPublished(@PublicSiteContext() site: Site, @Query() query: PublicAboutQueryDto) {
    return this.aboutService.findPublished(site.id, query.locale);
  }
}
