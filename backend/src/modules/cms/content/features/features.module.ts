import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feature } from './entities/feature.entity';
import { FeaturesService } from './features.service';
import { FeaturesController } from './features.controller';
import { FeaturesPublicController } from './features-public.controller';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { SiteModule } from '../../core/site/site.module';
import { RevisionsModule } from '../../core/revisions/revisions.module';
import { PublishingModule } from '../../core/publishing/publishing.module';
import { OrderingModule } from '../../core/ordering/ordering.module';

/**
 * `FeaturesModule` — CMS-D.5. Copies `HeroModule` (CMS-D.1)/`AboutModule`
 * (CMS-D.2)/`CtaModule` (CMS-D.3)/`StatisticsModule` (CMS-D.4) 1:1: same
 * cross-cutting imports plus `SiteModule` for `LocaleResolverService`.
 * Not exported — nothing outside this module needs `FeaturesService`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Feature]),
    SiteModule,
    RevisionsModule,
    PublishingModule,
    OrderingModule,
  ],
  controllers: [FeaturesController, FeaturesPublicController],
  providers: [FeaturesService, LocaleResolverService],
})
export class FeaturesModule {}
