import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TeacherProfile } from './entities/teacher-profile.entity';
import { BaseContentService } from '../../common/services/base-content.service';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { RevisionsService } from '../../core/revisions/revisions.service';
import { PublishingService } from '../../core/publishing/publishing.service';
import { OrderingService } from '../../core/ordering/ordering.service';

/** Public-facing shape — localized fields resolved to plain strings. */
export interface PublicTeacherProfile {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  photoUrl: string | null;
  sortOrder: number;
}

/**
 * `TeachersService` — CMS-H.3. Copies `TestimonialsService` (CMS-H.2)/
 * `GalleryService` (CMS-H.1) 1:1: the same `publish`/`unpublish`/
 * `schedule`/`reorder`/`restore` wrappers, the same `onModuleInit()`
 * self-registration with `PublishingService`, and the same
 * `findPublished()` shape resolving locale for the public controller —
 * `photoMedia` resolved to `photoUrl` the same way `TestimonialsService.
 * findPublished()` resolves `avatarMedia` to `avatarUrl`.
 *
 * Injects nothing from `modules/school`/`modules/teacher` — see
 * `TeacherProfile`'s doc comment for why. This service's only concerns
 * are the CMS lifecycle primitives every other content type gets.
 */
@Injectable()
export class TeachersService extends BaseContentService<TeacherProfile> implements OnModuleInit {
  constructor(
    @InjectRepository(TeacherProfile)
    repository: Repository<TeacherProfile>,
    revisionsService: RevisionsService,
    events: EventEmitter2,
    private readonly publishingService: PublishingService,
    private readonly orderingService: OrderingService,
    private readonly localeResolverService: LocaleResolverService,
  ) {
    super(repository, CmsEntityType.TEACHER_PROFILE, revisionsService, events);
  }

  onModuleInit(): void {
    this.publishingService.registerSchedulable({
      entityType: this.entityType,
      repository: this.repository,
      contentService: this,
    });
  }

  async publish(siteId: string, id: string, userId: string): Promise<TeacherProfile> {
    return this.publishingService.publish(this, this.entityType, siteId, id, userId);
  }

  async unpublish(siteId: string, id: string, userId: string): Promise<TeacherProfile> {
    return this.publishingService.unpublish(this, this.entityType, siteId, id, userId);
  }

  async schedule(
    siteId: string,
    id: string,
    scheduledAt: Date,
    userId: string,
  ): Promise<TeacherProfile> {
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
  ): Promise<TeacherProfile> {
    const revision = await this.revisionsService.restore(this.entityType, id, revisionId, userId);

    // Same "never trust a bare id" re-check every other content service
    // performs — `RevisionsService.restore()` doesn't scope by siteId.
    if (revision.siteId !== siteId) {
      throw new NotFoundException('Revision not found');
    }

    const snapshot = revision.snapshot as Partial<TeacherProfile>;
    return this.update(
      siteId,
      id,
      {
        name: snapshot.name,
        role: snapshot.role ?? null,
        bio: snapshot.bio ?? null,
        photoMediaId: snapshot.photoMediaId ?? null,
      } as DeepPartial<TeacherProfile>,
      userId,
    );
  }

  /** `GET /public/teachers` — every `PUBLISHED` row, ordered, localized. */
  async findPublished(siteId: string, requestedLocale?: string): Promise<PublicTeacherProfile[]> {
    const locale = await this.localeResolverService.resolve(siteId, requestedLocale);
    const defaultLocale = await this.localeResolverService.resolve(siteId);

    const rows = await this.repository.find({
      where: { siteId, status: ContentStatus.PUBLISHED } as any,
      relations: ['photoMedia'],
      order: { sortOrder: 'ASC' } as any,
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      role: this.localeResolverService.resolveText(row.role, locale, defaultLocale),
      bio: this.localeResolverService.resolveText(row.bio, locale, defaultLocale),
      photoUrl: row.photoMedia?.url ?? null,
      sortOrder: row.sortOrder,
    }));
  }
}
