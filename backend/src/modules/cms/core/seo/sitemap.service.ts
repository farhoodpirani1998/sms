import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../../content/pages/entities/page.entity';
import { NewsArticle } from '../../content/news/entities/news-article.entity';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { SiteService } from '../site/site.service';

/**
 * `SitemapService` — CMS-F.2/G.2. Walks every `PUBLISHED` `Page` and, as
 * of CMS-G.2, every `PUBLISHED` `NewsArticle` for a Site and renders a
 * standard `<urlset>` sitemap. Per the roadmap this service's shape
 * doesn't change to add News — it just gains a second query and a
 * second URL-building rule: Pages canonicalize at the Site root
 * (`/{slug}`, `home` special-cased to the bare domain), News is
 * namespaced under `/news/{slug}` — the same `/news/{slug}` path
 * `NewsService.findPublishedBySlug()` (CMS-G.2) builds
 * `ResolvedSeoMeta.canonicalUrl` from, so the sitemap and the article's
 * own canonical link always agree.
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
    @InjectRepository(NewsArticle)
    private readonly newsArticleRepository: Repository<NewsArticle>,
    private readonly siteService: SiteService,
  ) {}

  async generate(siteId: string): Promise<string> {
    const site = await this.siteService.findOne(siteId);
    const baseUrl = `https://${site.domain}`;

    const pages = await this.pageRepository.find({
      where: { siteId, status: ContentStatus.PUBLISHED } as any,
      order: { updatedAt: 'DESC' } as any,
    });

    const newsArticles = await this.newsArticleRepository.find({
      where: { siteId, status: ContentStatus.PUBLISHED } as any,
      order: { updatedAt: 'DESC' } as any,
    });

    const pageEntries = pages.map((page) => {
      const loc = page.slug === 'home' ? baseUrl : `${baseUrl}/${page.slug}`;
      return this.buildUrlEntry(loc, page.updatedAt);
    });

    const newsEntries = newsArticles.map((article) =>
      this.buildUrlEntry(`${baseUrl}/news/${article.slug}`, article.updatedAt),
    );

    const urlEntries = [...pageEntries, ...newsEntries].join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`;
  }

  private buildUrlEntry(loc: string, updatedAt: Date): string {
    const lastmod = updatedAt.toISOString();
    return `  <url>\n    <loc>${this.escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
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

