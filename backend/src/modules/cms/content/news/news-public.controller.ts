import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { NewsService } from './news.service';
import { PublicNewsListQueryDto, PublicNewsQueryDto } from './dto/news-query.dto';

/**
 * `cms/public/news` — CMS-G.2. Unguarded, uncached public read — same
 * stopgap every public controller since CMS-D uses (`?siteId=` query
 * param until CMS-I's Host-based guard/cache land).
 *
 * Two routes: `GET /cms/public/news` (paginated summaries, newest
 * first) and `GET /cms/public/news/:slug` (full detail with resolved
 * `title`/`excerpt`/`body` plus `ResolvedSeoMeta`) — the same
 * list/detail split `PagesPublicController` doesn't need (Pages has no
 * public listing) but every other content type's admin controller
 * already draws between `findAll`/`findOne`.
 */
@Controller('cms/public/news')
export class NewsPublicController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  async findPublished(@Query() query: PublicNewsListQueryDto) {
    return this.newsService.findPublishedList(
      query.siteId,
      { page: query.page, limit: query.limit },
      query.locale,
    );
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string, @Query() query: PublicNewsQueryDto) {
    const article = await this.newsService.findPublishedBySlug(query.siteId, slug, query.locale);
    if (!article) {
      throw new NotFoundException('News article not found');
    }
    return article;
  }
}
