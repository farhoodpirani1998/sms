import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { About } from './entities/about.entity';
import { BaseContentService } from '../../common/services/base-content.service';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { RevisionsService } from '../../core/revisions/revisions.service';
import { PublishingService } from '../../core/publishing/publishing.service';
import { OrderingService } from '../../core/ordering/ordering.service';

/** Public-facing shape — localized fields resolved to plain strings. */
export interface PublicAbout {
  id: string;
  title: string | null;
  body: string | null;
  coverMediaId: string | null;
  sortOrder: number;
}

/**
 * `AboutService` — CMS-D.2. Copies `HeroService` (CMS-D.1) 1:1: the same
 * `publish`/`unpublish`/`schedule`/`reorder`/`restore` wrappers, the
 * same `onModuleInit()` self-registration with `PublishingService`, and
 * the same `findPublished()` shape resolving locale via
 * `LocaleResolverService` for the public controller. Confirms the Hero
 * pattern replicates cleanly to a second content type, per the roadmap's
 * D.2 handoff note.
 */
@Injectable()
export class AboutService extends BaseContentService<About> implements OnModuleInit {
  constructor(
    @InjectRepository(About)
    repository: Repository<About>,
    revisionsService: RevisionsService,
    events: EventEmitter2,
    private readonly publishingService: PublishingService,
    private readonly orderingService: OrderingService,
    private readonly localeResolverService: LocaleResolverService,
  ) {
    super(repository, CmsEntityType.ABOUT, revisionsService, events);
  }

  onModuleInit(): void {
    this.publishingService.registerSchedulable({
      entityType: this.entityType,
      repository: this.repository,
      contentService: this,
    });
  }

  async publish(siteId: string, id: string, userId: string): Promise<About> {
    return this.publishingService.publish(this, this.entityType, siteId, id, userId);
  }

  async unpublish(siteId: string, id: string, userId: string): Promise<About> {
    return this.publishingService.unpublish(this, this.entityType, siteId, id, userId);
  }

  async schedule(siteId: string, id: string, scheduledAt: Date, userId: string): Promise<About> {
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

  async restore(siteId: string, id: string, revisionId: string, userId: string): Promise<About> {
    const revision = await this.revisionsService.restore(this.entityType, id, revisionId, userId);

    if (revision.siteId !== siteId) {
      throw new NotFoundException('Revision not found');
    }

    const snapshot = revision.snapshot as Partial<About>;
    return this.update(
      siteId,
      id,
      {
        title: snapshot.title,
        body: snapshot.body ?? null,
        coverMediaId: snapshot.coverMediaId ?? null,
      } as DeepPartial<About>,
      userId,
    );
  }

  /** `GET /cms/public/about` — every `PUBLISHED` row, ordered, localized. */
  async findPublished(siteId: string, requestedLocale?: string): Promise<PublicAbout[]> {
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
      coverMediaId: row.coverMediaId,
      sortOrder: row.sortOrder,
    }));
  }
}
