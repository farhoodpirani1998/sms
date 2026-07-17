import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Page } from '../../content/pages/entities/page.entity';
import { NewsArticle } from '../../content/news/entities/news-article.entity';
import { SitemapService } from './sitemap.service';
import { RobotsService } from './robots.service';
import { SeoPublicController } from './seo-public.controller';
import { SiteModule } from '../site/site.module';
import { PublicApiModule } from '../public-api/public-api.module';

/**
 * `SeoModule` — CMS-F.2/G.2, controller added in CMS-I.5. Aggregates
 * `SitemapService`/`RobotsService` and exports both (kept exported —
 * other future callers, like tests, can still inject them directly
 * with an explicit `siteId`, same as before). `SeoPublicController`
 * (CMS-I.5) is now declared here, wrapping both services in the
 * `PublicSiteContextGuard`/`PublicCacheInterceptor` pairing (imported
 * via `PublicApiModule`) every other public controller got across
 * CMS-I.3–I.5.
 *
 * Imports `Page`/`NewsArticle` directly (via `TypeOrmModule.forFeature`)
 * rather than depending on `PagesModule`/`NewsModule`'s services —
 * `core/*` modules read content tables directly where needed (same
 * convention `Feature`/`Hero`/`About` already establish by referencing
 * `core/media`'s `MediaAsset` the other direction) rather than a core
 * module reaching into a content module's service layer. CMS-G.2 adds
 * `NewsArticle` here alongside `Page`, per the CMS-F.2 doc comment's
 * note that this was always the plan once News existed.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Page, NewsArticle]), SiteModule, PublicApiModule],
  controllers: [SeoPublicController],
  providers: [SitemapService, RobotsService],
  exports: [SitemapService, RobotsService],
})
export class SeoModule {}
