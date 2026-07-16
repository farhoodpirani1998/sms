import { Controller, Get, Query } from '@nestjs/common';
import { FeaturesService } from './features.service';
import { PublicFeatureQueryDto } from './dto/feature-query.dto';

/**
 * `cms/public/features` — CMS-D.5. Unguarded, uncached public read —
 * same stopgap `HeroPublicController` (CMS-D.1)/`AboutPublicController`
 * (CMS-D.2)/`CtaPublicController` (CMS-D.3)/`StatisticsPublicController`
 * (CMS-D.4) use (`?siteId=` query param until CMS-I's Host-based
 * guard/cache land).
 */
@Controller('cms/public/features')
export class FeaturesPublicController {
  constructor(private readonly featuresService: FeaturesService) {}

  @Get()
  async findPublished(@Query() query: PublicFeatureQueryDto) {
    return this.featuresService.findPublished(query.siteId, query.locale);
  }
}
