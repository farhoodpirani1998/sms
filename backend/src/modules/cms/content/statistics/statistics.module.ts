import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Statistic } from './entities/statistic.entity';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { StatisticsPublicController } from './statistics-public.controller';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { SiteModule } from '../../core/site/site.module';
import { RevisionsModule } from '../../core/revisions/revisions.module';
import { PublishingModule } from '../../core/publishing/publishing.module';
import { OrderingModule } from '../../core/ordering/ordering.module';
import { PublicApiModule } from '../../core/public-api/public-api.module';

/**
 * `StatisticsModule` — CMS-D.4. Copies `HeroModule` (CMS-D.1)/
 * `AboutModule` (CMS-D.2)/`CtaModule` (CMS-D.3) 1:1: same cross-cutting
 * imports plus `SiteModule` for `LocaleResolverService`. Not exported —
 * nothing outside this module needs `StatisticsService`.
 *
 * CMS-I.3 adds `PublicApiModule` so the public controller can
 * `@UseGuards(PublicSiteContextGuard)`/`@UseInterceptors(PublicCacheInterceptor)`
 * — Site is now resolved from the `Host` header instead of `?siteId=`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Statistic]),
    SiteModule,
    RevisionsModule,
    PublishingModule,
    OrderingModule,
    PublicApiModule,
  ],
  controllers: [StatisticsController, StatisticsPublicController],
  providers: [StatisticsService, LocaleResolverService],
})
export class StatisticsModule {}
