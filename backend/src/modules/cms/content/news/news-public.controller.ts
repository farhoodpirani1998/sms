import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { NewsService } from './news.service';
import { PublicNewsListQueryDto, PublicNewsQueryDto } from './dto/news-query.dto';
import { PublicSiteContextGuard } from '../../core/public-api/guards/public-site-context.guard';
import { PublicCacheInterceptor } from '../../core/public-api/interceptors/public-cache.interceptor';
import { PublicSiteContext } from '../../common/decorators/public-site-context.decorator';
import { Site } from '../../core/site/entities/site.entity';

/**
 * `public/news` — CMS-G.2, wired for CMS-I.4. Site-scoped via
 * `PublicSiteContextGuard` (Host-header resolution, replacing the old
 * `?siteId=` query param) and cached by `PublicCacheInterceptor`, same
 * pairing every CMS-D/E/F public controller got in CMS-I.3/I.4. Both
 * routes sit under the one guard/interceptor pair at the controller
 * level — the list route and the by-slug detail route get independent
 * cache keys since the key is built from the full request path.
 *
 * Two routes: `GET /public/news` (paginated summaries, newest
 * first) and `GET /public/news/:slug` (full detail with resolved
 * `title`/`excerpt`/`body` plus `ResolvedSeoMeta`) — the same
 * list/detail split `PagesPublicController` doesn't need (Pages has no
 * public listing) but every other content type's admin controller
 * already draws between `findAll`/`findOne`.
 */
@Controller('public/news')
@UseGuards(PublicSiteContextGuard)
@UseInterceptors(PublicCacheInterceptor)
export class NewsPublicController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  async findPublished(@PublicSiteContext() site: Site, @Query() query: PublicNewsListQueryDto) {
    return this.newsService.findPublishedList(
      site.id,
      { page: query.page, limit: query.limit },
      query.locale,
    );
  }

  @Get(':slug')
  async findBySlug(
    @Param('slug') slug: string,
    @PublicSiteContext() site: Site,
    @Query() query: PublicNewsQueryDto,
  ) {
    const article = await this.newsService.findPublishedBySlug(site.id, slug, query.locale);
    if (!article) {
      throw new NotFoundException('News article not found');
    }
    return article;
  }
}
