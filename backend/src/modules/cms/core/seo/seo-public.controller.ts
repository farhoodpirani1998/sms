import { Controller, Get, Header, UseGuards, UseInterceptors } from '@nestjs/common';
import { SitemapService } from './sitemap.service';
import { RobotsService } from './robots.service';
import { PublicSiteContextGuard } from '../public-api/guards/public-site-context.guard';
import { PublicCacheInterceptor } from '../public-api/interceptors/public-cache.interceptor';
import { PublicSiteContext } from '../../common/decorators/public-site-context.decorator';
import { Site } from '../site/entities/site.entity';

/**
 * `SeoPublicController` — CMS-I.5, the last public controller the
 * roadmap adds. Exposes `SitemapService`/`RobotsService` (both plain
 * injectables since CMS-F.2/G.2, per their own doc comments) as actual
 * `GET /sitemap.xml`/`GET /robots.txt` routes, now that
 * `PublicSiteContextGuard` (CMS-I.1) exists to resolve which `Site` a
 * bare request is for. Same guard/interceptor pairing every other
 * public controller got in CMS-I.3–I.5 — a cache outage or Redis miss
 * still falls through to a fresh `generate()` call, same as any other
 * public read.
 *
 * Deliberately not nested under `cms/public/` — crawlers expect
 * `/sitemap.xml` and `/robots.txt` at these exact paths (relative to
 * whatever origin `app.setGlobalPrefix('api/v1')` serves them under),
 * not a CMS-specific subpath, so this controller declares no path
 * prefix of its own.
 */
@Controller()
@UseGuards(PublicSiteContextGuard)
@UseInterceptors(PublicCacheInterceptor)
export class SeoPublicController {
  constructor(
    private readonly sitemapService: SitemapService,
    private readonly robotsService: RobotsService,
  ) {}

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  async sitemap(@PublicSiteContext() site: Site): Promise<string> {
    return this.sitemapService.generate(site.id);
  }

  @Get('robots.txt')
  @Header('Content-Type', 'text/plain')
  async robots(@PublicSiteContext() site: Site): Promise<string> {
    return this.robotsService.generate(site.id);
  }
}
