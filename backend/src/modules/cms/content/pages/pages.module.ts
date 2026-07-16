import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Page } from './entities/page.entity';
import { PagesService } from './pages.service';
import { PagesController } from './pages.controller';
import { PagesPublicController } from './pages-public.controller';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { SiteModule } from '../../core/site/site.module';
import { RevisionsModule } from '../../core/revisions/revisions.module';
import { PublishingModule } from '../../core/publishing/publishing.module';
import { OrderingModule } from '../../core/ordering/ordering.module';

/**
 * `PagesModule` — CMS-F.1/F.2. Same cross-cutting imports every content
 * module needs (`RevisionsModule`, `PublishingModule`, `OrderingModule`,
 * `SiteModule` for `LocaleResolverService`/`SiteService`).
 * `PagesPublicController` (CMS-F.2, by-slug lookup) is added alongside
 * `PagesController`. The shared `core/seo/` module (`SeoModule`) is a
 * separate import in `cms.module.ts`, not here — it reads `Page`
 * directly rather than through `PagesService`, so it has no dependency
 * on this module. Not exported — nothing outside this module needs
 * `PagesService`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Page]),
    SiteModule,
    RevisionsModule,
    PublishingModule,
    OrderingModule,
  ],
  controllers: [PagesController, PagesPublicController],
  providers: [PagesService, LocaleResolverService],
})
export class PagesModule {}

