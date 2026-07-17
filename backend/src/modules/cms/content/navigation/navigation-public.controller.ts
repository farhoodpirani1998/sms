import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { NavigationService } from './navigation.service';
import { PublicNavigationQueryDto } from './dto/navigation-item-query.dto';
import { PublicSiteContextGuard } from '../../core/public-api/guards/public-site-context.guard';
import { PublicCacheInterceptor } from '../../core/public-api/interceptors/public-cache.interceptor';
import { PublicSiteContext } from '../../common/decorators/public-site-context.decorator';
import { Site } from '../../core/site/entities/site.entity';

/**
 * `public/navigation` — CMS-E.2, wired for CMS-I.4. Site-scoped via
 * `PublicSiteContextGuard` (Host-header resolution, replacing the old
 * `?siteId=` query param) and cached by `PublicCacheInterceptor`, same
 * pairing every CMS-D public controller got in CMS-I.3 — the assembled
 * tree response (`findPublishedTree()`, vs. a flat array) doesn't change
 * how the guard/interceptor apply; the interceptor caches whatever body
 * the handler returns, tree or not.
 */
@Controller('public/navigation')
@UseGuards(PublicSiteContextGuard)
@UseInterceptors(PublicCacheInterceptor)
export class NavigationPublicController {
  constructor(private readonly navigationService: NavigationService) {}

  @Get()
  async findTree(@PublicSiteContext() site: Site, @Query() query: PublicNavigationQueryDto) {
    return this.navigationService.findPublishedTree(site.id, query.locale);
  }
}
