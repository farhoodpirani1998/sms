import { Injectable } from '@nestjs/common';
import { SiteService } from '../site/site.service';

/**
 * `RobotsService` — CMS-F.2. Generates a `robots.txt` body for a Site,
 * pointing crawlers at `SitemapService`'s output. Wired to `GET
 * /robots.txt` by `SeoPublicController` (CMS-I.5), same as
 * `SitemapService`'s own doc comment describes.
 *
 * Honors `Site.seoDefaults.noIndex` (CMS-A.2's `SeoMeta` on the `Site`
 * entity itself, not `ResolvedSeoMeta`) as a whole-Site opt-out —
 * blocking every crawler is the one case simple enough to not need a
 * page-by-page rule.
 */
@Injectable()
export class RobotsService {
  constructor(private readonly siteService: SiteService) {}

  async generate(siteId: string): Promise<string> {
    const site = await this.siteService.findOne(siteId);
    const baseUrl = `https://${site.domain}`;

    if (site.seoDefaults?.noIndex) {
      return 'User-agent: *\nDisallow: /\n';
    }

    return `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
  }
}
