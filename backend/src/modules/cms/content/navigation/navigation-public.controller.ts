import { Controller, Get, Query } from '@nestjs/common';
import { NavigationService } from './navigation.service';
import { PublicNavigationQueryDto } from './dto/navigation-item-query.dto';

/**
 * `cms/public/navigation` — CMS-E.2. Unguarded, uncached public read —
 * same stopgap every CMS-D public controller uses (`?siteId=` query
 * param until CMS-I's Host-based guard/cache land). Unlike those,
 * returns an assembled tree (`findPublishedTree()`) rather than a flat
 * array — this is the one shape difference the roadmap calls out for
 * Navigation's public endpoint.
 */
@Controller('cms/public/navigation')
export class NavigationPublicController {
  constructor(private readonly navigationService: NavigationService) {}

  @Get()
  async findTree(@Query() query: PublicNavigationQueryDto) {
    return this.navigationService.findPublishedTree(query.siteId, query.locale);
  }
}
