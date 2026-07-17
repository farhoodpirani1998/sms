import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { FaqService } from './faq.service';
import { PublicFaqQueryDto } from './dto/faq-query.dto';
import { PublicSiteContextGuard } from '../../core/public-api/guards/public-site-context.guard';
import { PublicCacheInterceptor } from '../../core/public-api/interceptors/public-cache.interceptor';
import { PublicSiteContext } from '../../common/decorators/public-site-context.decorator';
import { Site } from '../../core/site/entities/site.entity';

/**
 * `public/faq` — CMS-D wired for CMS-I.3. Public read
 * endpoint: every `PUBLISHED` Faq row for a Site, localized.
 * Deliberately unauthenticated (this is public-facing website content),
 * but now Site-scoped via `PublicSiteContextGuard` (Host-header
 * resolution, with the CMS-A.3/I.1 dev slug fallback) instead of the
 * old `?siteId=` query param, and cached by `PublicCacheInterceptor`
 * per the roadmap's CMS-I.2/I.3 pairing.
 */
@Controller('public/faq')
@UseGuards(PublicSiteContextGuard)
@UseInterceptors(PublicCacheInterceptor)
export class FaqPublicController {
  constructor(private readonly faqService: FaqService) {}

  @Get()
  async findPublished(@PublicSiteContext() site: Site, @Query() query: PublicFaqQueryDto) {
    return this.faqService.findPublished(site.id, query.locale);
  }
}
