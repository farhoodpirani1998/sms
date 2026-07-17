import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GalleryItem } from './entities/gallery-item.entity';
import { BaseContentService, PaginatedResult } from '../../common/services/base-content.service';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { RevisionsService } from '../../core/revisions/revisions.service';
import { PublishingService } from '../../core/publishing/publishing.service';
import { OrderingService } from '../../core/ordering/ordering.service';
import { normalizePagination, PaginationParams } from '../../../../common/utils/pagination';

/** Public-facing shape — localized `caption` resolved, `mediaUrl` resolved from the required `MediaAsset` relation. */
export interface PublicGalleryItem {
  id: string;
  caption: string | null;
  mediaUrl: string;
  category: string | null;
  sortOrder: number;
}

/**
 * `GalleryService` — CMS-H.1. Copies `FeaturesService` (CMS-D.5)'s shape
 * (the same `publish`/`unpublish`/`schedule`/`reorder`/`restore`
 * wrappers, `onModuleInit()` self-registration with `PublishingService`,
 * `findPublished()` resolving locale for the public controller) with two
 * departures: `mediaId` is required, so `create()`/`update()` don't need
 * the "if supplied" guard every optional `coverMediaId` field gets
 * (DB-level `NOT NULL` on `media_id` is the actual enforcement — this
 * class doesn't re-validate that the id refers to a real row, same
 * "client supplies it, FK constraint validates it" split every other
 * media reference already uses); and both `findAll`/`findPublished` take
 * an optional `category` filter, since gallery items are the first
 * CMS-H.1+ type the roadmap groups by an admin-defined label.
 */
@Injectable()
export class GalleryService extends BaseContentService<GalleryItem> implements OnModuleInit {
  constructor(
    @InjectRepository(GalleryItem)
    repository: Repository<GalleryItem>,
    revisionsService: RevisionsService,
    events: EventEmitter2,
    private readonly publishingService: PublishingService,
    private readonly orderingService: OrderingService,
    private readonly localeResolverService: LocaleResolverService,
  ) {
    super(repository, CmsEntityType.GALLERY_ITEM, revisionsService, events);
  }

  onModuleInit(): void {
    this.publishingService.registerSchedulable({
      entityType: this.entityType,
      repository: this.repository,
      contentService: this,
    });
  }

  /**
   * `GET /cms/gallery` — same paging as `BaseContentService.findAll()`,
   * with an optional `category` filter layered on top rather than
   * overriding the inherited method's signature (every other content
   * type's admin list has no equivalent filter to preserve).
   */
  async findAllByCategory(
    siteId: string,
    pagination: PaginationParams,
    category?: string,
  ): Promise<PaginatedResult<GalleryItem>> {
    if (!category) {
      return this.findAll(siteId, pagination);
    }

    const { page, limit, skip } = normalizePagination(pagination);
    const [data, total] = await this.repository.findAndCount({
      where: { siteId, category } as any,
      order: { sortOrder: 'ASC', createdAt: 'DESC' } as any,
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async publish(siteId: string, id: string, userId: string): Promise<GalleryItem> {
    return this.publishingService.publish(this, this.entityType, siteId, id, userId);
  }

  async unpublish(siteId: string, id: string, userId: string): Promise<GalleryItem> {
    return this.publishingService.unpublish(this, this.entityType, siteId, id, userId);
  }

  async schedule(
    siteId: string,
    id: string,
    scheduledAt: Date,
    userId: string,
  ): Promise<GalleryItem> {
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

  async restore(siteId: string, id: string, revisionId: string, userId: string): Promise<GalleryItem> {
    const revision = await this.revisionsService.restore(this.entityType, id, revisionId, userId);

    // Same "never trust a bare id" re-check every other content service
    // performs — `RevisionsService.restore()` doesn't scope by siteId.
    if (revision.siteId !== siteId) {
      throw new NotFoundException('Revision not found');
    }

    const snapshot = revision.snapshot as Partial<GalleryItem>;
    return this.update(
      siteId,
      id,
      {
        caption: snapshot.caption ?? null,
        mediaId: snapshot.mediaId,
        category: snapshot.category ?? null,
      } as DeepPartial<GalleryItem>,
      userId,
    );
  }

  /** `GET /public/gallery` — every `PUBLISHED` row, ordered, localized, optional `category` filter. */
  async findPublished(
    siteId: string,
    requestedLocale?: string,
    category?: string,
  ): Promise<PublicGalleryItem[]> {
    const locale = await this.localeResolverService.resolve(siteId, requestedLocale);
    const defaultLocale = await this.localeResolverService.resolve(siteId);

    const where: Record<string, unknown> = { siteId, status: ContentStatus.PUBLISHED };
    if (category) {
      where.category = category;
    }

    const rows = await this.repository.find({
      where: where as any,
      relations: ['media'],
      order: { sortOrder: 'ASC' } as any,
    });

    return rows.map((row) => ({
      id: row.id,
      caption: this.localeResolverService.resolveText(row.caption, locale, defaultLocale),
      mediaUrl: row.media.url,
      category: row.category,
      sortOrder: row.sortOrder,
    }));
  }
}
