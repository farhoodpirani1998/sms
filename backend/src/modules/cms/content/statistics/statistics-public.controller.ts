import { Controller, Get, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { PublicStatisticQueryDto } from './dto/statistic-query.dto';

/**
 * `cms/public/statistics` — CMS-D.4. Unguarded, uncached public read —
 * same stopgap `HeroPublicController` (CMS-D.1)/`AboutPublicController`
 * (CMS-D.2)/`CtaPublicController` (CMS-D.3) use (`?siteId=` query param
 * until CMS-I's Host-based guard/cache land).
 */
@Controller('cms/public/statistics')
export class StatisticsPublicController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  async findPublished(@Query() query: PublicStatisticQueryDto) {
    return this.statisticsService.findPublished(query.siteId, query.locale);
  }
}
