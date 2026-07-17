import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NewsArticle } from './entities/news-article.entity';
import { BaseContentService } from '../../common/services/base-content.service';
import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { RevisionsService } from '../../core/revisions/revisions.service';
import { PublishingService } from '../../core/publishing/publishing.service';
import { OrderingService } from '../../core/ordering/ordering.service';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { SiteService } from '../../core/site/site.service';
import { ResolvedSeoMeta } from '../../core/seo/seo-meta.type';
import { normalizePagination, PaginationParams } from '../../../../common/utils/pagination';

/** Public listing shape — one entry per published article, locale-resolved, no `body`. */
export interface PublicNewsSummary {
  id: string;
  slug: string;
  title: string | null;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: Date | null;
}

export interface PublicNewsListResult {
  data: PublicNewsSummary[];
  total: number;
  page: number;
  limit: number;
}

/** Public detail shape — full body plus `ResolvedSeoMeta`, same as `PublicPage`. */
export interface PublicNewsArticle {
  id: string;
  slug: string;
  title: string | null;
  excerpt: string | null;
  body: string | null;
  coverImageUrl: string | null;
  publishedAt: Date | null;
  seo: ResolvedSeoMeta;
}

/**
 * `NewsService` — CMS-G.1/G.2. Mirrors `PagesService` (CMS-F.1/F.2) 1:1
 * for the admin side: extends `BaseContentService` for create/findAll/
 * findOne/update/remove/applyStatusTransition, adds the same
 * slug-uniqueness re-check (`assertSlugAvailable`) ahead of the DB's
 * own `UNIQUE (site_id, slug)` constraint, and the same `publish`/
 * `unpublish`/`schedule`/`reorder`/`restore` wrappers plus
 * `onModuleInit()` self-registration with `PublishingService`.
 *
 * CMS-G.2 adds the public side and is where `LocaleResolverService`/
 * `SiteService` first get injected (same as `PagesService` only gained
 * them in F.2, not F.1): `findPublishedList()` is News' one genuine
 * departure from the Pages shape — Pages has no public listing, only
 * by-slug (`findPublishedBySlug`, mirrored here unchanged) — paginated
 * via the same `normalizePagination()` helper `BaseContentService.
 * findAll()` uses, filtered to `PUBLISHED` and ordered newest-first by
 * `publishedAt` (falling back to `sortOrder`/`createdAt` is intentionally
 * not needed here since a published row always has `publishedAt` set by
 * `PublishingService.publish()`).
 */
@Injectable()
export class NewsService extends BaseContentService<NewsArticle> implements OnModuleInit {
  constructor(
    @InjectRepository(NewsArticle)
    repository: Repository<NewsArticle>,
    revisionsService: RevisionsService,
    events: EventEmitter2,
    private readonly publishingService: PublishingService,
    private readonly orderingService: OrderingService,
    private readonly localeResolverService: LocaleResolverService,
    private readonly siteService: SiteService,
  ) {
    super(repository, CmsEntityType.NEWS_ARTICLE, revisionsService, events);
  }

  onModuleInit(): void {
    this.publishingService.registerSchedulable({
      entityType: this.entityType,
      repository: this.repository,
      contentService: this,
    });
  }

  override async create(
    siteId: string,
    data: DeepPartial<NewsArticle>,
    userId: string,
  ): Promise<NewsArticle> {
    if (data.slug) {
      await this.assertSlugAvailable(siteId, data.slug as string);
    }
    return super.create(siteId, data, userId);
  }

  override async update(
    siteId: string,
    id: string,
    data: DeepPartial<NewsArticle>,
    userId: string,
  ): Promise<NewsArticle> {
    if (data.slug) {
      await this.assertSlugAvailable(siteId, data.slug as string, id);
    }
    return super.update(siteId, id, data, userId);
  }

  private async assertSlugAvailable(
    siteId: string,
    slug: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.repository.findOne({ where: { siteId, slug } as any });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`A news article with slug "${slug}" already exists for this Site`);
    }
  }

  async publish(siteId: string, id: string, userId: string): Promise<NewsArticle> {
    return this.publishingService.publish(this, this.entityType, siteId, id, userId);
  }

  async unpublish(siteId: string, id: string, userId: string): Promise<NewsArticle> {
    return this.publishingService.unpublish(this, this.entityType, siteId, id, userId);
  }

  async schedule(
    siteId: string,
    id: string,
    scheduledAt: Date,
    userId: string,
  ): Promise<NewsArticle> {
    return this.publishingService.schedule(this, this.entityType, siteId, id, scheduledAt, userId);
  }

  async reorder(siteId: string, orderedIds: string[], userId: string): Promise<void> {
    return this.orderingService.reorder(
      this.getRepository(),
      this.entityType,
      siteId,
      orderedIds,
      userId,
    );
  }

  async restore(siteId: string, id: string, revisionId: string, userId: string): Promise<NewsArticle> {
    const revision = await this.revisionsService.restore(this.entityType, id, revisionId, userId);

    // Same "never trust a bare id" re-check every other content service
    // performs — `RevisionsService.restore()` doesn't scope by siteId.
    if (revision.siteId !== siteId) {
      throw new NotFoundException('Revision not found');
    }

    const snapshot = revision.snapshot as Partial<NewsArticle>;
    if (snapshot.slug) {
      await this.assertSlugAvailable(siteId, snapshot.slug, id);
    }

    return this.update(
      siteId,
      id,
      {
        slug: snapshot.slug,
        title: snapshot.title,
        excerpt: snapshot.excerpt ?? null,
        body: snapshot.body ?? null,
        metaTitle: snapshot.metaTitle ?? null,
        metaDescription: snapshot.metaDescription ?? null,
        coverMediaId: snapshot.coverMediaId ?? null,
      } as DeepPartial<NewsArticle>,
      userId,
    );
  }

  /**
   * `GET /public/news` — CMS-G.2. Paginated, locale-resolved
   * summaries of every `PUBLISHED` article for a Site, newest first.
   * Deliberately returns `PublicNewsSummary` (no `body`, no `seo`) —
   * a listing view has no need for either, same "detail carries more
   * than a list row" split every other content type's admin
   * `findAll()`/`findOne()` pair already draws, just applied here to
   * the public side.
   */
  async findPublishedList(
    siteId: string,
    pagination: PaginationParams,
    requestedLocale?: string,
  ): Promise<PublicNewsListResult> {
    const { page, limit, skip } = normalizePagination(pagination);
    const locale = await this.localeResolverService.resolve(siteId, requestedLocale);
    const defaultLocale = await this.localeResolverService.resolve(siteId);

    const [articles, total] = await this.repository.findAndCount({
      where: { siteId, status: ContentStatus.PUBLISHED } as any,
      relations: ['coverMedia'],
      order: { publishedAt: 'DESC' } as any,
      skip,
      take: limit,
    });

    const data = articles.map((article) => ({
      id: article.id,
      slug: article.slug,
      title: this.localeResolverService.resolveText(article.title, locale, defaultLocale),
      excerpt: this.localeResolverService.resolveText(article.excerpt, locale, defaultLocale),
      coverImageUrl: article.coverMedia?.url ?? null,
      publishedAt: article.publishedAt,
    }));

    return { data, total, page, limit };
  }

  /**
   * `GET /public/news/:slug` — CMS-G.2. Resolves the published
   * article at `slug` for this Site, locale-resolved, with
   * `ResolvedSeoMeta` built the same way `PagesService.
   * findPublishedBySlug()` builds it: the article's own `metaTitle`/
   * `metaDescription` first, falling back to its `title` and then to
   * `Site.seoDefaults`, with `canonicalUrl` always built from
   * `Site.domain` + a `/news/{slug}` path (Pages canonicalizes at the
   * root; News is namespaced under `/news/` per `SitemapService`'s
   * News entries, CMS-G.2).
   */
  async findPublishedBySlug(
    siteId: string,
    slug: string,
    requestedLocale?: string,
  ): Promise<PublicNewsArticle | null> {
    const article = await this.repository.findOne({
      where: { siteId, slug, status: ContentStatus.PUBLISHED } as any,
      relations: ['coverMedia'],
    });

    if (!article) {
      return null;
    }

    const site = await this.siteService.findOne(siteId);
    const locale = await this.localeResolverService.resolve(siteId, requestedLocale);
    const defaultLocale = await this.localeResolverService.resolve(siteId);

    const title = this.localeResolverService.resolveText(article.title, locale, defaultLocale);
    const excerpt = this.localeResolverService.resolveText(article.excerpt, locale, defaultLocale);
    const body = this.localeResolverService.resolveText(article.body, locale, defaultLocale);

    const seoTitle =
      this.localeResolverService.resolveText(article.metaTitle, locale, defaultLocale) ??
      title ??
      this.resolveSiteSeoText(site.seoDefaults?.title, locale, defaultLocale);

    const seoDescription =
      this.localeResolverService.resolveText(article.metaDescription, locale, defaultLocale) ??
      this.resolveSiteSeoText(site.seoDefaults?.description, locale, defaultLocale);

    const seo: ResolvedSeoMeta = {
      title: seoTitle ?? null,
      description: seoDescription ?? null,
      ogImageUrl: article.coverMedia?.url ?? null,
      canonicalUrl: `https://${site.domain}/news/${article.slug}`,
    };

    return {
      id: article.id,
      slug: article.slug,
      title,
      excerpt,
      body,
      coverImageUrl: article.coverMedia?.url ?? null,
      publishedAt: article.publishedAt,
      seo,
    };
  }

  private resolveSiteSeoText(
    localized: Record<string, string> | undefined,
    locale: string,
    defaultLocale: string,
  ): string | null {
    if (!localized) {
      return null;
    }
    return this.localeResolverService.resolveText(localized, locale, defaultLocale);
  }
}
