import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NavigationItem } from './entities/navigation-item.entity';
import { NavigationService } from './navigation.service';
import { NavigationController } from './navigation.controller';
import { NavigationPublicController } from './navigation-public.controller';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { SiteModule } from '../../core/site/site.module';
import { RevisionsModule } from '../../core/revisions/revisions.module';
import { PublishingModule } from '../../core/publishing/publishing.module';
import { OrderingModule } from '../../core/ordering/ordering.module';

/**
 * `NavigationModule` — CMS-E.2. Same cross-cutting imports every
 * content module needs (`SiteModule` for `LocaleResolverService`,
 * `RevisionsModule`, `PublishingModule`, `OrderingModule`). Not
 * exported — nothing outside this module needs `NavigationService`.
 * Completes CMS-E alongside `SiteSettingsModule` (CMS-E.1), which
 * shares the same migration's other table.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([NavigationItem]),
    SiteModule,
    RevisionsModule,
    PublishingModule,
    OrderingModule,
  ],
  controllers: [NavigationController, NavigationPublicController],
  providers: [NavigationService, LocaleResolverService],
})
export class NavigationModule {}
