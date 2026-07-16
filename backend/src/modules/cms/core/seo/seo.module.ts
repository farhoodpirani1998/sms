import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Page } from '../../content/pages/entities/page.entity';
import { SitemapService } from './sitemap.service';
import { RobotsService } from './robots.service';
import { SiteModule } from '../site/site.module';

/**
 * `SeoModule` — CMS-F.2. Aggregates `SitemapService`/`RobotsService` and
 * exports both so `SeoPublicController` (CMS-I.5) can inject them once
 * it exists — no controller of its own yet, same "service now, route
 * later" shape `PublishingModule`/`OrderingModule` had between CMS-C.4
 * and CMS-C.5.
 *
 * Imports `Page` directly (via `TypeOrmModule.forFeature`) rather than
 * depending on `PagesModule`/`PagesService` — `core/*` modules read
 * content tables directly where needed (same convention
 * `Feature`/`Hero`/`About` already establish by referencing
 * `core/media`'s `MediaAsset` the other direction) rather than a core
 * module reaching into a content module's service layer. News
 * (CMS-G.2) adds its own `TypeOrmModule.forFeature([NewsArticle])` here
 * alongside `Page` once that table exists.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Page]), SiteModule],
  providers: [SitemapService, RobotsService],
  exports: [SitemapService, RobotsService],
})
export class SeoModule {}
