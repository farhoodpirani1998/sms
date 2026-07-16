import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { PagesService } from './pages.service';
import { PublicPageQueryDto } from './dto/page-query.dto';

/**
 * `cms/public/pages/:slug` — CMS-F.2. Unguarded, uncached public read —
 * same stopgap every public controller since CMS-D uses (`?siteId=`
 * query param until CMS-I's Host-based guard/cache land). Returns the
 * resolved `title`/`excerpt`/`body` plus `ResolvedSeoMeta` a page
 * renderer needs for `<title>`/meta tags/canonical link.
 */
@Controller('cms/public/pages')
export class PagesPublicController {
  constructor(private readonly pagesService: PagesService) {}

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string, @Query() query: PublicPageQueryDto) {
    const page = await this.pagesService.findPublishedBySlug(query.siteId, slug, query.locale);
    if (!page) {
      throw new NotFoundException('Page not found');
    }
    return page;
  }
}
