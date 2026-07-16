import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Faq } from './entities/faq.entity';
import { FaqService } from './faq.service';
import { FaqController } from './faq.controller';
import { FaqPublicController } from './faq-public.controller';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { SiteModule } from '../../core/site/site.module';
import { RevisionsModule } from '../../core/revisions/revisions.module';
import { PublishingModule } from '../../core/publishing/publishing.module';
import { OrderingModule } from '../../core/ordering/ordering.module';

/**
 * `FaqModule` — CMS-D.6. Copies `HeroModule` (CMS-D.1)/`AboutModule`
 * (CMS-D.2)/`CtaModule` (CMS-D.3)/`StatisticsModule` (CMS-D.4)/
 * `FeaturesModule` (CMS-D.5) 1:1: same cross-cutting imports plus
 * `SiteModule` for `LocaleResolverService`. Not exported — nothing
 * outside this module needs `FaqService`. Last module CMS-D adds; all
 * six simple content types are now complete.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Faq]),
    SiteModule,
    RevisionsModule,
    PublishingModule,
    OrderingModule,
  ],
  controllers: [FaqController, FaqPublicController],
  providers: [FaqService, LocaleResolverService],
})
export class FaqModule {}
