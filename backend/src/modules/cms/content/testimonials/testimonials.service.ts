import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Testimonial } from './entities/testimonial.entity';
import { BaseContentService } from '../../common/services/base-content.service';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { RevisionsService } from '../../core/revisions/revisions.service';
import { PublishingService } from '../../core/publishing/publishing.service';
import { OrderingService } from '../../core/ordering/ordering.service';

/** Public-facing shape — localized fields resolved to plain strings. */
export interface PublicTestimonial {
  id: string;
  quote: string | null;
  authorName: string;
  authorRole: string | null;
  avatarUrl: string | null;
  rating: number | null;
  sortOrder: number;
}

/**
 * `TestimonialsService` — CMS-H.2. Copies `FeaturesService` (CMS-D.5)/
 * `GalleryService` (CMS-H.1) 1:1: the same `publish`/`unpublish`/
 * `schedule`/`reorder`/`restore` wrappers, the same `onModuleInit()`
 * self-registration with `PublishingService`, and the same
 * `findPublished()` shape resolving locale for the public controller —
 * `avatarMedia` resolved to `avatarUrl` the same way `GalleryService.
 * findPublished()` resolves `media` to `mediaUrl`, except optional here
 * since `avatarMediaId` is nullable (unlike `GalleryItem.mediaId`).
 */
@Injectable()
export class TestimonialsService extends BaseContentService<Testimonial> implements OnModuleInit {
  constructor(
    @InjectRepository(Testimonial)
    repository: Repository<Testimonial>,
    revisionsService: RevisionsService,
    events: EventEmitter2,
    private readonly publishingService: PublishingService,
    private readonly orderingService: OrderingService,
    private readonly localeResolverService: LocaleResolverService,
  ) {
    super(repository, CmsEntityType.TESTIMONIAL, revisionsService, events);
  }

  onModuleInit(): void {
    this.publishingService.registerSchedulable({
      entityType: this.entityType,
      repository: this.repository,
      contentService: this,
    });
  }

  async publish(siteId: string, id: string, userId: string): Promise<Testimonial> {
    return this.publishingService.publish(this, this.entityType, siteId, id, userId);
  }

  async unpublish(siteId: string, id: string, userId: string): Promise<Testimonial> {
    return this.publishingService.unpublish(this, this.entityType, siteId, id, userId);
  }

  async schedule(
    siteId: string,
    id: string,
    scheduledAt: Date,
    userId: string,
  ): Promise<Testimonial> {
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

  async restore(siteId: string, id: string, revisionId: string, userId: string): Promise<Testimonial> {
    const revision = await this.revisionsService.restore(this.entityType, id, revisionId, userId);

    // Same "never trust a bare id" re-check every other content service
    // performs — `RevisionsService.restore()` doesn't scope by siteId.
    if (revision.siteId !== siteId) {
      throw new NotFoundException('Revision not found');
    }

    const snapshot = revision.snapshot as Partial<Testimonial>;
    return this.update(
      siteId,
      id,
      {
        quote: snapshot.quote,
        authorName: snapshot.authorName,
        authorRole: snapshot.authorRole ?? null,
        avatarMediaId: snapshot.avatarMediaId ?? null,
        rating: snapshot.rating ?? null,
      } as DeepPartial<Testimonial>,
      userId,
    );
  }

  /** `GET /cms/public/testimonials` — every `PUBLISHED` row, ordered, localized. */
  async findPublished(siteId: string, requestedLocale?: string): Promise<PublicTestimonial[]> {
    const locale = await this.localeResolverService.resolve(siteId, requestedLocale);
    const defaultLocale = await this.localeResolverService.resolve(siteId);

    const rows = await this.repository.find({
      where: { siteId, status: ContentStatus.PUBLISHED } as any,
      relations: ['avatarMedia'],
      order: { sortOrder: 'ASC' } as any,
    });

    return rows.map((row) => ({
      id: row.id,
      quote: this.localeResolverService.resolveText(row.quote, locale, defaultLocale),
      authorName: row.authorName,
      authorRole: this.localeResolverService.resolveText(row.authorRole, locale, defaultLocale),
      avatarUrl: row.avatarMedia?.url ?? null,
      rating: row.rating,
      sortOrder: row.sortOrder,
    }));
  }
}
