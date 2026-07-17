import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Hero } from './entities/hero.entity';
import { BaseContentService } from '../../common/services/base-content.service';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { RevisionsService } from '../../core/revisions/revisions.service';
import { PublishingService } from '../../core/publishing/publishing.service';
import { OrderingService } from '../../core/ordering/ordering.service';

/** Shape `HeroPublicController` returns — localized fields resolved to
 * plain strings for the requested (or Site-default) locale, rather than
 * the raw `LocalizedText` maps the admin API works with. */
export interface PublicHero {
  id: string;
  title: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  coverMediaId: string | null;
  sortOrder: number;
}

/**
 * `HeroService` — CMS-D.1. Extends `BaseContentService` exactly the way
 * `ProofBlockService` (CMS-C.5) did, and is the reference every other
 * `content/*` service (CMS-D.2 onward) copies: the same three thin
 * wrappers over `PublishingService`/`OrderingService`
 * (`publish`/`unpublish`/`schedule`, `reorder`), the same `restore()`
 * shape re-applying only editorial fields (never lifecycle/ordering
 * state — see `ProofBlockService.restore()`'s doc comment for why that
 * split exists), and the same `onModuleInit()` self-registration with
 * `PublishingService` so the scheduled-publish cron can scan Hero's
 * `SCHEDULED` rows.
 *
 * The one thing `ProofBlockService` didn't need and this class adds:
 * `findPublished()`, backing the public controller. It's the first real
 * use of `LocaleResolverService` (CMS-C.3) outside its own unit tests —
 * resolves the effective locale once per request via
 * `LocaleResolverService.resolve()`, then narrows each row's
 * `LocalizedText` columns to plain strings via
 * `LocaleResolverService.resolveText()`, so a public frontend never has
 * to deal with the admin-facing per-locale jsonb shape.
 */
@Injectable()
export class HeroService extends BaseContentService<Hero> implements OnModuleInit {
  constructor(
    @InjectRepository(Hero)
    repository: Repository<Hero>,
    revisionsService: RevisionsService,
    events: EventEmitter2,
    private readonly publishingService: PublishingService,
    private readonly orderingService: OrderingService,
    private readonly localeResolverService: LocaleResolverService,
  ) {
    super(repository, CmsEntityType.HERO, revisionsService, events);
  }

  onModuleInit(): void {
    this.publishingService.registerSchedulable({
      entityType: this.entityType,
      repository: this.repository,
      contentService: this,
    });
  }

  async publish(siteId: string, id: string, userId: string): Promise<Hero> {
    return this.publishingService.publish(this, this.entityType, siteId, id, userId);
  }

  async unpublish(siteId: string, id: string, userId: string): Promise<Hero> {
    return this.publishingService.unpublish(this, this.entityType, siteId, id, userId);
  }

  async schedule(siteId: string, id: string, scheduledAt: Date, userId: string): Promise<Hero> {
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

  async restore(siteId: string, id: string, revisionId: string, userId: string): Promise<Hero> {
    const revision = await this.revisionsService.restore(this.entityType, id, revisionId, userId);

    // `RevisionsService.restore()` matches purely on (entityType,
    // entityId, revisionId) with no `siteId` to scope by — re-checking
    // here keeps the same "never trust a bare id" rule every other
    // method on this class follows (see `ProofBlockService.restore()`).
    if (revision.siteId !== siteId) {
      throw new NotFoundException('Revision not found');
    }

    const snapshot = revision.snapshot as Partial<Hero>;
    return this.update(
      siteId,
      id,
      {
        title: snapshot.title,
        subtitle: snapshot.subtitle ?? null,
        ctaLabel: snapshot.ctaLabel ?? null,
        ctaUrl: snapshot.ctaUrl ?? null,
        coverMediaId: snapshot.coverMediaId ?? null,
      } as DeepPartial<Hero>,
      userId,
    );
  }

  /**
   * `GET /public/hero` — every `PUBLISHED` Hero row for the Site,
   * ordered by `sortOrder`, localized to the resolved locale. No
   * pagination (a homepage hero list is small by nature) and no
   * guard/caching yet — those are CMS-I's job (public-site-context
   * guard + Redis interceptor land there, per the roadmap).
   */
  async findPublished(siteId: string, requestedLocale?: string): Promise<PublicHero[]> {
    const locale = await this.localeResolverService.resolve(siteId, requestedLocale);
    const defaultLocale = await this.localeResolverService.resolve(siteId);

    const rows = await this.repository.find({
      where: { siteId, status: ContentStatus.PUBLISHED } as any,
      order: { sortOrder: 'ASC' } as any,
    });

    return rows.map((row) => ({
      id: row.id,
      title: this.localeResolverService.resolveText(row.title, locale, defaultLocale),
      subtitle: this.localeResolverService.resolveText(row.subtitle, locale, defaultLocale),
      ctaLabel: this.localeResolverService.resolveText(row.ctaLabel, locale, defaultLocale),
      ctaUrl: row.ctaUrl,
      coverMediaId: row.coverMediaId,
      sortOrder: row.sortOrder,
    }));
  }
}
