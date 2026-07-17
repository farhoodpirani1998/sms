import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PagesService } from './pages.service';
import { PublicPageQueryDto } from './dto/page-query.dto';
import { PublicSiteContextGuard } from '../../core/public-api/guards/public-site-context.guard';
import { PublicCacheInterceptor } from '../../core/public-api/interceptors/public-cache.interceptor';
import { PublicSiteContext } from '../../common/decorators/public-site-context.decorator';
import { Site } from '../../core/site/entities/site.entity';

/**
 * `cms/public/pages/:slug` — CMS-F.2, wired for CMS-I.4. Site-scoped via
 * `PublicSiteContextGuard` (Host-header resolution, replacing the old
 * `?siteId=` query param) and cached by `PublicCacheInterceptor`, same
 * pairing every CMS-D/E public controller got in CMS-I.3/I.4 — the
 * `:slug` route param is untouched by either; the cache key is built
 * from the full request path (see `PublicCacheInterceptor.buildKey()`),
 * so distinct slugs already get distinct keys under the same Site.
 * Returns the resolved `title`/`excerpt`/`body` plus `ResolvedSeoMeta` a
 * page renderer needs for `<title>`/meta tags/canonical link.
 */
@Controller('cms/public/pages')
@UseGuards(PublicSiteContextGuard)
@UseInterceptors(PublicCacheInterceptor)
export class PagesPublicController {
  constructor(private readonly pagesService: PagesService) {}

  @Get(':slug')
  async findBySlug(
    @Param('slug') slug: string,
    @PublicSiteContext() site: Site,
    @Query() query: PublicPageQueryDto,
  ) {
    const page = await this.pagesService.findPublishedBySlug(site.id, slug, query.locale);
    if (!page) {
      throw new NotFoundException('Page not found');
    }
    return page;
  }
}
