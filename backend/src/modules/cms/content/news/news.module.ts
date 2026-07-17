import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsArticle } from './entities/news-article.entity';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { NewsPublicController } from './news-public.controller';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { SiteModule } from '../../core/site/site.module';
import { RevisionsModule } from '../../core/revisions/revisions.module';
import { PublishingModule } from '../../core/publishing/publishing.module';
import { OrderingModule } from '../../core/ordering/ordering.module';

/**
 * `NewsModule` — CMS-G.1/G.2. Same cross-cutting imports every content
 * module needs (`RevisionsModule`, `PublishingModule`, `OrderingModule`,
 * `SiteModule` for `LocaleResolverService`/`SiteService`) — `SiteModule`
 * and `LocaleResolverService` are added in this sub-phase (G.2) now that
 * `NewsPublicController`'s locale-resolved reads need them, same as
 * `PagesModule` only gained them once its own public side (F.2) did.
 * Not exported — nothing outside this module needs `NewsService`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([NewsArticle]),
    SiteModule,
    RevisionsModule,
    PublishingModule,
    OrderingModule,
  ],
  controllers: [NewsController, NewsPublicController],
  providers: [NewsService, LocaleResolverService],
})
export class NewsModule {}

