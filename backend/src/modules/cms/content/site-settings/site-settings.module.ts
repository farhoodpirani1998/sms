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

/**
 * `SiteSettingsModule` — CMS-E.1. Same cross-cutting import shape every
 * CMS-D module uses (`SiteModule` for `LocaleResolverService`,
 * `RevisionsModule`, `PublishingModule`) — minus `OrderingModule`,
 * since this singleton has no `reorder()`. Not exported — nothing
 * outside this module needs `SiteSettingsService`.
 */
@Module({
  imports: [TypeOrmModule.forFeature([SiteSettings]), SiteModule, RevisionsModule, PublishingModule],
  controllers: [SiteSettingsController, SiteSettingsPublicController],
  providers: [SiteSettingsService, LocaleResolverService],
})
export class SiteSettingsModule {}
