import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Campus } from './entities/campus.entity';
import { BaseContentService } from '../../common/services/base-content.service';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { RevisionsService } from '../../core/revisions/revisions.service';
import { PublishingService } from '../../core/publishing/publishing.service';
import { OrderingService } from '../../core/ordering/ordering.service';

/** Public-facing shape — localized fields resolved to plain strings. */
export interface PublicCampus {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  sortOrder: number;
}

/**
 * `CampusesService` — CMS-H.4. Copies `TeachersService` (CMS-H.3)/
 * `TestimonialsService` (CMS-H.2)/`GalleryService` (CMS-H.1) 1:1: the
 * same `publish`/`unpublish`/`schedule`/`reorder`/`restore` wrappers,
 * the same `onModuleInit()` self-registration with `PublishingService`,
 * and the same `findPublished()` shape resolving locale for the public
 * controller. No `MediaAsset` relation to resolve here — see `Campus`'s
 * doc comment — so `findPublished()` has no `photoMedia`/`avatarMedia`
 * equivalent and no `relations` array to load.
 */
@Injectable()
export class CampusesService extends BaseContentService<Campus> implements OnModuleInit {
  constructor(
    @InjectRepository(Campus)
    repository: Repository<Campus>,
    revisionsService: RevisionsService,
    events: EventEmitter2,
    private readonly publishingService: PublishingService,
    private readonly orderingService: OrderingService,
    private readonly localeResolverService: LocaleResolverService,
  ) {
    super(repository, CmsEntityType.CAMPUS, revisionsService, events);
  }

  onModuleInit(): void {
    this.publishingService.registerSchedulable({
      entityType: this.entityType,
      repository: this.repository,
      contentService: this,
    });
  }

  async publish(siteId: string, id: string, userId: string): Promise<Campus> {
    return this.publishingService.publish(this, this.entityType, siteId, id, userId);
  }

  async unpublish(siteId: string, id: string, userId: string): Promise<Campus> {
    return this.publishingService.unpublish(this, this.entityType, siteId, id, userId);
  }

  async schedule(
    siteId: string,
    id: string,
    scheduledAt: Date,
    userId: string,
  ): Promise<Campus> {
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

  async restore(
    siteId: string,
    id: string,
    revisionId: string,
    userId: string,
  ): Promise<Campus> {
    const revision = await this.revisionsService.restore(this.entityType, id, revisionId, userId);

    // Same "never trust a bare id" re-check every other content service
    // performs — `RevisionsService.restore()` doesn't scope by siteId.
    if (revision.siteId !== siteId) {
      throw new NotFoundException('Revision not found');
    }

    const snapshot = revision.snapshot as Partial<Campus>;
    return this.update(
      siteId,
      id,
      {
        name: snapshot.name,
        address: snapshot.address ?? null,
        description: snapshot.description ?? null,
      } as DeepPartial<Campus>,
      userId,
    );
  }

  /** `GET /cms/public/campuses` — every `PUBLISHED` row, ordered, localized. */
  async findPublished(siteId: string, requestedLocale?: string): Promise<PublicCampus[]> {
    const locale = await this.localeResolverService.resolve(siteId, requestedLocale);
    const defaultLocale = await this.localeResolverService.resolve(siteId);

    const rows = await this.repository.find({
      where: { siteId, status: ContentStatus.PUBLISHED } as any,
      order: { sortOrder: 'ASC' } as any,
    });

    return rows.map((row) => ({
      id: row.id,
      name: this.localeResolverService.resolveText(row.name, locale, defaultLocale),
      address: this.localeResolverService.resolveText(row.address, locale, defaultLocale),
      description: this.localeResolverService.resolveText(row.description, locale, defaultLocale),
      sortOrder: row.sortOrder,
    }));
  }
}
