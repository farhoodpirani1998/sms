import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Page } from './entities/page.entity';
import { PagesService } from './pages.service';
import { PagesController } from './pages.controller';
import { SiteModule } from '../../core/site/site.module';
import { RevisionsModule } from '../../core/revisions/revisions.module';
import { PublishingModule } from '../../core/publishing/publishing.module';
import { OrderingModule } from '../../core/ordering/ordering.module';

/**
 * `PagesModule` — CMS-F.1. Same cross-cutting imports every content
 * module needs (`RevisionsModule`, `PublishingModule`, `OrderingModule`)
 * plus `SiteModule` (kept for parity with every other content module's
 * imports, even though `PagesService` itself doesn't need
 * `LocaleResolverService` until CMS-F.2's public controller reads a
 * locale-resolved field). Not exported — nothing outside this module
 * needs `PagesService`. `PagesPublicController` and `core/seo/` land in
 * CMS-F.2 and are added to this module's `controllers`/a new
 * `SeoModule` import at that point.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Page]),
    SiteModule,
    RevisionsModule,
    PublishingModule,
    OrderingModule,
  ],
  controllers: [PagesController],
  providers: [PagesService],
})
export class PagesModule {}
