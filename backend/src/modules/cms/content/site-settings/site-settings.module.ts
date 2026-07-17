import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteSettings } from './entities/site-settings.entity';
import { SiteSettingsService } from './site-settings.service';
import { SiteSettingsController } from './site-settings.controller';
import { SiteSettingsPublicController } from './site-settings-public.controller';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { SiteModule } from '../../core/site/site.module';
import { RevisionsModule } from '../../core/revisions/revisions.module';
import { PublishingModule } from '../../core/publishing/publishing.module';
import { PublicApiModule } from '../../core/public-api/public-api.module';

/**
 * `SiteSettingsModule` — CMS-E.1. Same cross-cutting import shape every
 * CMS-D module uses (`SiteModule` for `LocaleResolverService`,
 * `RevisionsModule`, `PublishingModule`) — minus `OrderingModule`,
 * since this singleton has no `reorder()`. Not exported — nothing
 * outside this module needs `SiteSettingsService`.
 *
 * CMS-I.4 adds `PublicApiModule` so the public controller can
 * `@UseGuards(PublicSiteContextGuard)`/`@UseInterceptors(PublicCacheInterceptor)`
 * — Site is now resolved from the `Host` header instead of `?siteId=`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([SiteSettings]),
    SiteModule,
    RevisionsModule,
    PublishingModule,
    PublicApiModule,
  ],
  controllers: [SiteSettingsController, SiteSettingsPublicController],
  providers: [SiteSettingsService, LocaleResolverService],
})
export class SiteSettingsModule {}
