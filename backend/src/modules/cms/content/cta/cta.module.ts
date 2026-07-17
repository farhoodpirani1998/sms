import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cta } from './entities/cta.entity';
import { CtaService } from './cta.service';
import { CtaController } from './cta.controller';
import { CtaPublicController } from './cta-public.controller';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { SiteModule } from '../../core/site/site.module';
import { RevisionsModule } from '../../core/revisions/revisions.module';
import { PublishingModule } from '../../core/publishing/publishing.module';
import { OrderingModule } from '../../core/ordering/ordering.module';
import { PublicApiModule } from '../../core/public-api/public-api.module';

/**
 * `CtaModule` — CMS-D.3. Copies `HeroModule` (CMS-D.1)/`AboutModule`
 * (CMS-D.2) 1:1: same cross-cutting imports plus `SiteModule` for
 * `LocaleResolverService`. Not exported — nothing outside this module
 * needs `CtaService`.
 *
 * CMS-I.3 adds `PublicApiModule` so the public controller can
 * `@UseGuards(PublicSiteContextGuard)`/`@UseInterceptors(PublicCacheInterceptor)`
 * — Site is now resolved from the `Host` header instead of `?siteId=`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Cta]),
    SiteModule,
    RevisionsModule,
    PublishingModule,
    OrderingModule,
    PublicApiModule,
  ],
  controllers: [CtaController, CtaPublicController],
  providers: [CtaService, LocaleResolverService],
})
export class CtaModule {}
