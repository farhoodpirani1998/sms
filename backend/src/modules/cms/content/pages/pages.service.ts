import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Page } from './entities/page.entity';
import { BaseContentService } from '../../common/services/base-content.service';
import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { RevisionsService } from '../../core/revisions/revisions.service';
import { PublishingService } from '../../core/publishing/publishing.service';
import { OrderingService } from '../../core/ordering/ordering.service';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { SiteService } from '../../core/site/site.service';
import { ResolvedSeoMeta } from '../../core/seo/seo-meta.type';

/** Public-facing shape — localized fields resolved, SEO resolved with Site-level fallback. */
export interface PublicPage {
  id: string;
  slug: string;
  title: string | null;
  excerpt: string | null;
  body: string | null;
  seo: ResolvedSeoMeta;
}

/**
 * `PagesService` — CMS-F.1/F.2. Extends `BaseContentService` for the
 * same create/findAll/findOne/update/remove/applyStatusTransition
 * primitives every content type gets, plus one thing no CMS-D/E type
 * needed: slug uniqueness. The DB's `UNIQUE (site_id, slug)` constraint
 * (CMS-F.1's migration) is the actual enforcement point; `create()`/
 * `update()` here re-check first so a duplicate slug surfaces as a
 * clear `ConflictException` rather than a raw Postgres error bubbling
 * up through `save()`.
 *
 * Same `publish`/`unpublish`/`schedule`/`reorder`/`restore` wrappers and
 * `onModuleInit()` self-registration with `PublishingService` as every
 * other content type. `findPublishedBySlug()` (CMS-F.2) is the public
 * by-slug read: resolves `title`/`excerpt`/`body` via
 * `LocaleResolverService` same as every other public read, then builds
 * `ResolvedSeoMeta` — `metaTitle`/`metaDescription` fall back to the
 * page's own `title` and to `Site.seoDefaults` (CMS-A.2) in that order
 * when a Page has no SEO fields of its own, and `canonicalUrl` is
 * always built from `Site.domain` + the Page's `slug`.
 */
@Injectable()
export class PagesService extends BaseContentService<Page> implements OnModuleInit {
  constructor(
    @InjectRepository(Page)
    repository: Repository<Page>,
    revisionsService: RevisionsService,
    events: EventEmitter2,
    private readonly publishingService: PublishingService,
    private readonly orderingService: OrderingService,
    private readonly localeResolverService: LocaleResolverService,
    private readonly siteService: SiteService,
  ) {
    super(repository, CmsEntityType.PAGE, revisionsService, events);
  }

  onModuleInit(): void {
    this.publishingService.registerSchedulable({
      entityType: this.entityType,
      repository: this.repository,
      contentService: this,
    });
  }

  override async create(siteId: string, data: DeepPartial<Page>, userId: string): Promise<Page> {
    if (data.slug) {
      await this.assertSlugAvailable(siteId, data.slug as string);
    }
    return super.create(siteId, data, userId);
  }

  override async update(
    siteId: string,
    id: string,
    data: DeepPartial<Page>,
    userId: string,
  ): Promise<Page> {
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
      throw new ConflictException(`A page with slug "${slug}" already exists for this Site`);
    }
  }

  async publish(siteId: string, id: string, userId: string): Promise<Page> {
    return this.publishingService.publish(this, this.entityType, siteId, id, userId);
  }

  async unpublish(siteId: string, id: string, userId: string): Promise<Page> {
    return this.publishingService.unpublish(this, this.entityType, siteId, id, userId);
  }

  async schedule(siteId: string, id: string, scheduledAt: Date, userId: string): Promise<Page> {
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

  async restore(siteId: string, id: string, revisionId: string, userId: string): Promise<Page> {
    const revision = await this.revisionsService.restore(this.entityType, id, revisionId, userId);

    // Same "never trust a bare id" re-check every other content service
    // performs — `RevisionsService.restore()` doesn't scope by siteId.
    if (revision.siteId !== siteId) {
      throw new NotFoundException('Revision not found');
    }

    const snapshot = revision.snapshot as Partial<Page>;
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
        ogImageMediaId: snapshot.ogImageMediaId ?? null,
      } as DeepPartial<Page>,
      userId,
    );
  }

  /**
   * `GET /cms/public/pages/:slug` — resolves the published Page at
   * `slug` for this Site, locale-resolved, with `ResolvedSeoMeta` built
   * from the Page's own SEO fields, falling back to its `title` and
   * then to `Site.seoDefaults` for anything left unset.
   */
  async findPublishedBySlug(
    siteId: string,
    slug: string,
    requestedLocale?: string,
  ): Promise<PublicPage | null> {
    const page = await this.repository.findOne({
      where: { siteId, slug, status: ContentStatus.PUBLISHED } as any,
      relations: ['ogImageMedia'],
    });

    if (!page) {
      return null;
    }

    const site = await this.siteService.findOne(siteId);
    const locale = await this.localeResolverService.resolve(siteId, requestedLocale);
    const defaultLocale = await this.localeResolverService.resolve(siteId);

    const title = this.localeResolverService.resolveText(page.title, locale, defaultLocale);
    const excerpt = this.localeResolverService.resolveText(page.excerpt, locale, defaultLocale);
    const body = this.localeResolverService.resolveText(page.body, locale, defaultLocale);

    const seoTitle =
      this.localeResolverService.resolveText(page.metaTitle, locale, defaultLocale) ??
      title ??
      this.resolveSiteSeoText(site.seoDefaults?.title, locale, defaultLocale);

    const seoDescription =
      this.localeResolverService.resolveText(page.metaDescription, locale, defaultLocale) ??
      this.resolveSiteSeoText(site.seoDefaults?.description, locale, defaultLocale);

    const seo: ResolvedSeoMeta = {
      title: seoTitle ?? null,
      description: seoDescription ?? null,
      ogImageUrl: page.ogImageMedia?.url ?? null,
      canonicalUrl: `https://${site.domain}/${page.slug}`,
    };

    return {
      id: page.id,
      slug: page.slug,
      title,
      excerpt,
      body,
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
