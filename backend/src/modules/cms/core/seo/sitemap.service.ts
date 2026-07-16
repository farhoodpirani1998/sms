import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../../content/pages/entities/page.entity';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { SiteService } from '../site/site.service';

/**
 * `SitemapService` — CMS-F.2. Walks every `PUBLISHED` `Page` for a Site
 * and renders a standard `<urlset>` sitemap. News (CMS-G.2) is added
 * alongside Pages once that content type exists — per the roadmap this
 * service's shape doesn't change, it just gains a second query.
 *
 * Not yet wired to an HTTP route: `GET /sitemap.xml` is exposed by
 * `SeoPublicController` in CMS-I.5, once the Host-based
 * `PublicSiteContextGuard` (CMS-I.1) exists to resolve which Site a
 * bare `/sitemap.xml` request is for. Until then this is a plain
 * injectable other code (and tests) can call directly with an explicit
 * `siteId`.
 *
 * Absolute URLs are built from `Site.domain` (CMS-A.2) — the same field
 * `PublicSiteContextGuard` will eventually resolve *from* on the way
 * in, used here in the opposite direction (Site → URL) for generated
 * links.
 */
@Injectable()
export class SitemapService {
  constructor(
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    private readonly siteService: SiteService,
  ) {}

  async generate(siteId: string): Promise<string> {
    const site = await this.siteService.findOne(siteId);
    const baseUrl = `https://${site.domain}`;

    const pages = await this.pageRepository.find({
      where: { siteId, status: ContentStatus.PUBLISHED } as any,
      order: { updatedAt: 'DESC' } as any,
    });

    const urlEntries = pages
      .map((page) => {
        const loc = page.slug === 'home' ? baseUrl : `${baseUrl}/${page.slug}`;
        const lastmod = page.updatedAt.toISOString();
        return `  <url>\n    <loc>${this.escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`;
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
