import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Statistic } from './entities/statistic.entity';
import { BaseContentService } from '../../common/services/base-content.service';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { RevisionsService } from '../../core/revisions/revisions.service';
import { PublishingService } from '../../core/publishing/publishing.service';
import { OrderingService } from '../../core/ordering/ordering.service';

/** Public-facing shape — localized fields resolved to plain strings. */
export interface PublicStatistic {
  id: string;
  label: string | null;
  value: string;
  icon: string | null;
  sortOrder: number;
}

/**
 * `StatisticsService` — CMS-D.4. Copies `HeroService` (CMS-D.1)/
 * `AboutService` (CMS-D.2)/`CtaService` (CMS-D.3) 1:1: the same
 * `publish`/`unpublish`/`schedule`/`reorder`/`restore` wrappers, the
 * same `onModuleInit()` self-registration with `PublishingService`, and
 * the same `findPublished()` shape resolving locale via
 * `LocaleResolverService` for the public controller.
 */
@Injectable()
export class StatisticsService extends BaseContentService<Statistic> implements OnModuleInit {
  constructor(
    @InjectRepository(Statistic)
    repository: Repository<Statistic>,
    revisionsService: RevisionsService,
    events: EventEmitter2,
    private readonly publishingService: PublishingService,
    private readonly orderingService: OrderingService,
    private readonly localeResolverService: LocaleResolverService,
  ) {
    super(repository, CmsEntityType.STATISTIC, revisionsService, events);
  }

  onModuleInit(): void {
    this.publishingService.registerSchedulable({
      entityType: this.entityType,
      repository: this.repository,
      contentService: this,
    });
  }

  async publish(siteId: string, id: string, userId: string): Promise<Statistic> {
    return this.publishingService.publish(this, this.entityType, siteId, id, userId);
  }

  async unpublish(siteId: string, id: string, userId: string): Promise<Statistic> {
    return this.publishingService.unpublish(this, this.entityType, siteId, id, userId);
  }

  async schedule(
    siteId: string,
    id: string,
    scheduledAt: Date,
    userId: string,
  ): Promise<Statistic> {
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

  async restore(siteId: string, id: string, revisionId: string, userId: string): Promise<Statistic> {
    const revision = await this.revisionsService.restore(this.entityType, id, revisionId, userId);

    // Same "never trust a bare id" re-check every other content service
    // performs — `RevisionsService.restore()` doesn't scope by siteId.
    if (revision.siteId !== siteId) {
      throw new NotFoundException('Revision not found');
    }

    const snapshot = revision.snapshot as Partial<Statistic>;
    return this.update(
      siteId,
      id,
      {
        label: snapshot.label,
        value: snapshot.value,
        icon: snapshot.icon ?? null,
      } as DeepPartial<Statistic>,
      userId,
    );
  }

  /** `GET /public/statistics` — every `PUBLISHED` row, ordered, localized. */
  async findPublished(siteId: string, requestedLocale?: string): Promise<PublicStatistic[]> {
    const locale = await this.localeResolverService.resolve(siteId, requestedLocale);
    const defaultLocale = await this.localeResolverService.resolve(siteId);

    const rows = await this.repository.find({
      where: { siteId, status: ContentStatus.PUBLISHED } as any,
      order: { sortOrder: 'ASC' } as any,
    });

    return rows.map((row) => ({
      id: row.id,
      label: this.localeResolverService.resolveText(row.label, locale, defaultLocale),
      value: row.value,
      icon: row.icon,
      sortOrder: row.sortOrder,
    }));
  }
}
