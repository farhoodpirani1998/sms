import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cta } from './entities/cta.entity';
import { BaseContentService } from '../../common/services/base-content.service';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { RevisionsService } from '../../core/revisions/revisions.service';
import { PublishingService } from '../../core/publishing/publishing.service';
import { OrderingService } from '../../core/ordering/ordering.service';

/** Public-facing shape — localized fields resolved to plain strings. */
export interface PublicCta {
  id: string;
  title: string | null;
  body: string | null;
  buttonLabel: string | null;
  buttonUrl: string | null;
  sortOrder: number;
}

/**
 * `CtaService` — CMS-D.3. Copies `HeroService` (CMS-D.1)/`AboutService`
 * (CMS-D.2) 1:1: the same `publish`/`unpublish`/`schedule`/`reorder`/
 * `restore` wrappers, the same `onModuleInit()` self-registration with
 * `PublishingService`, and the same `findPublished()` shape resolving
 * locale via `LocaleResolverService` for the public controller.
 */
@Injectable()
export class CtaService extends BaseContentService<Cta> implements OnModuleInit {
  constructor(
    @InjectRepository(Cta)
    repository: Repository<Cta>,
    revisionsService: RevisionsService,
    events: EventEmitter2,
    private readonly publishingService: PublishingService,
    private readonly orderingService: OrderingService,
    private readonly localeResolverService: LocaleResolverService,
  ) {
    super(repository, CmsEntityType.CTA, revisionsService, events);
  }

  onModuleInit(): void {
    this.publishingService.registerSchedulable({
      entityType: this.entityType,
      repository: this.repository,
      contentService: this,
    });
  }

  async publish(siteId: string, id: string, userId: string): Promise<Cta> {
    return this.publishingService.publish(this, this.entityType, siteId, id, userId);
  }

  async unpublish(siteId: string, id: string, userId: string): Promise<Cta> {
    return this.publishingService.unpublish(this, this.entityType, siteId, id, userId);
  }

  async schedule(siteId: string, id: string, scheduledAt: Date, userId: string): Promise<Cta> {
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

  async restore(siteId: string, id: string, revisionId: string, userId: string): Promise<Cta> {
    const revision = await this.revisionsService.restore(this.entityType, id, revisionId, userId);

    // Same "never trust a bare id" re-check every other content service
    // performs — `RevisionsService.restore()` doesn't scope by siteId.
    if (revision.siteId !== siteId) {
      throw new NotFoundException('Revision not found');
    }

    const snapshot = revision.snapshot as Partial<Cta>;
    return this.update(
      siteId,
      id,
      {
        title: snapshot.title,
        body: snapshot.body ?? null,
        buttonLabel: snapshot.buttonLabel ?? null,
        buttonUrl: snapshot.buttonUrl ?? null,
      } as DeepPartial<Cta>,
      userId,
    );
  }

  /** `GET /public/cta` — every `PUBLISHED` row, ordered, localized. */
  async findPublished(siteId: string, requestedLocale?: string): Promise<PublicCta[]> {
    const locale = await this.localeResolverService.resolve(siteId, requestedLocale);
    const defaultLocale = await this.localeResolverService.resolve(siteId);

    const rows = await this.repository.find({
      where: { siteId, status: ContentStatus.PUBLISHED } as any,
      order: { sortOrder: 'ASC' } as any,
    });

    return rows.map((row) => ({
      id: row.id,
      title: this.localeResolverService.resolveText(row.title, locale, defaultLocale),
      body: this.localeResolverService.resolveText(row.body, locale, defaultLocale),
      buttonLabel: this.localeResolverService.resolveText(row.buttonLabel, locale, defaultLocale),
      buttonUrl: row.buttonUrl,
      sortOrder: row.sortOrder,
    }));
  }
}
