import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LessThanOrEqual, Repository } from 'typeorm';
import { AuditAction } from '../../../../common/audit/audit-log.entity';
import { AuditService } from '../../../../common/audit/audit.service';
import { BaseCmsEntity } from '../../common/entities/base-cms.entity';
import { BaseContentService } from '../../common/services/base-content.service';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';
import {
  CMS_DOMAIN_EVENTS,
  ContentPublishedEvent,
  ContentScheduledEvent,
  ContentUnpublishedEvent,
} from '../events/cms-domain-events';

/**
 * A content type registers itself here (from its own module's
 * `onModuleInit`, CMS-D onward) so the scheduled-publish cron (this
 * sub-phase) can scan it without `PublishingService` knowing the 14
 * concrete content types in advance — same "closed set the caller
 * supplies, not a hardcoded list" shape as `CmsEntityType` itself.
 */
export interface SchedulableContentType<T extends BaseCmsEntity> {
  entityType: CmsEntityType;
  repository: Repository<T>;
  contentService: BaseContentService<T>;
}

/**
 * `PublishingService` — CMS-C.4. The publishing state machine every
 * `content/*` service (CMS-D onward) calls into rather than flipping
 * `status`/`publishedAt`/`scheduledAt` itself (§4.3 of
 * docs/architecture/CMS_ARCHITECTURE.md). Generic over `CmsEntityType`
 * the same way `RevisionsService` (CMS-C.2) is: no concrete content
 * table exists yet (that's proven in CMS-C.5), so every method takes
 * the caller's own `BaseContentService<T>` instance and `CmsEntityType`
 * rather than injecting a specific repository.
 *
 * Each of `publish()`/`unpublish()`/`schedule()` does the same four
 * things the architecture doc calls for: (1) delegate to
 * `BaseContentService.applyStatusTransition()` (CMS-C.3), which flips
 * the row and snapshots a revision, (2) emit the specific
 * `cms.content.*` domain event, (3) write an `AuditService.record()`
 * row with `schoolId: null` (CMS is a bounded context separate from
 * School — see docs/architecture/CMS_ARCHITECTURE.md §1 — so a CMS
 * audit row never references a School).
 *
 * `publishScheduled()` is the same as `publish()` but with no acting
 * user — used by `ScheduledPublishCron`/`runScheduledPublish()` below
 * when a `SCHEDULED` row's `scheduledAt` elapses on its own.
 */
@Injectable()
export class PublishingService {
  private readonly logger = new Logger(PublishingService.name);
  private readonly registrations = new Map<CmsEntityType, SchedulableContentType<any>>();

  constructor(
    private readonly auditService: AuditService,
    private readonly events: EventEmitter2,
  ) {}

  /** Called once per content type module at startup (CMS-D onward). */
  registerSchedulable<T extends BaseCmsEntity>(descriptor: SchedulableContentType<T>): void {
    this.registrations.set(descriptor.entityType, descriptor);
  }

  async publish<T extends BaseCmsEntity>(
    contentService: BaseContentService<T>,
    entityType: CmsEntityType,
    siteId: string,
    id: string,
    userId: string,
  ): Promise<T> {
    const publishedAt = new Date();

    const entity = await contentService.applyStatusTransition(
      siteId,
      id,
      { status: ContentStatus.PUBLISHED, publishedAt, scheduledAt: null } as any,
      userId,
    );

    this.events.emit(
      CMS_DOMAIN_EVENTS.CONTENT_PUBLISHED,
      new ContentPublishedEvent(entityType, entity.id, siteId, userId, publishedAt),
    );

    await this.auditService.record({
      schoolId: null,
      userId,
      action: AuditAction.CMS_CONTENT_PUBLISHED,
      entityType,
      entityId: entity.id,
      newValue: { status: entity.status, publishedAt: entity.publishedAt },
    });

    return entity;
  }

  async unpublish<T extends BaseCmsEntity>(
    contentService: BaseContentService<T>,
    entityType: CmsEntityType,
    siteId: string,
    id: string,
    userId: string,
  ): Promise<T> {
    const entity = await contentService.applyStatusTransition(
      siteId,
      id,
      { status: ContentStatus.DRAFT, publishedAt: null, scheduledAt: null } as any,
      userId,
    );

    this.events.emit(
      CMS_DOMAIN_EVENTS.CONTENT_UNPUBLISHED,
      new ContentUnpublishedEvent(entityType, entity.id, siteId, userId),
    );

    await this.auditService.record({
      schoolId: null,
      userId,
      action: AuditAction.CMS_CONTENT_UNPUBLISHED,
      entityType,
      entityId: entity.id,
      newValue: { status: entity.status },
    });

    return entity;
  }

  async schedule<T extends BaseCmsEntity>(
    contentService: BaseContentService<T>,
    entityType: CmsEntityType,
    siteId: string,
    id: string,
    scheduledAt: Date,
    userId: string,
  ): Promise<T> {
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('scheduledAt must be in the future');
    }

    const entity = await contentService.applyStatusTransition(
      siteId,
      id,
      { status: ContentStatus.SCHEDULED, scheduledAt, publishedAt: null } as any,
      userId,
    );

    this.events.emit(
      CMS_DOMAIN_EVENTS.CONTENT_SCHEDULED,
      new ContentScheduledEvent(entityType, entity.id, siteId, userId, scheduledAt),
    );

    await this.auditService.record({
      schoolId: null,
      userId,
      action: AuditAction.CMS_CONTENT_SCHEDULED,
      entityType,
      entityId: entity.id,
      newValue: { status: entity.status, scheduledAt: entity.scheduledAt },
    });

    return entity;
  }

  /** Same as `publish()`, but for a row the cron is flipping on its own. */
  private async publishScheduled<T extends BaseCmsEntity>(
    contentService: BaseContentService<T>,
    entityType: CmsEntityType,
    siteId: string,
    id: string,
  ): Promise<T> {
    const publishedAt = new Date();

    const entity = await contentService.applyStatusTransition(
      siteId,
      id,
      { status: ContentStatus.PUBLISHED, publishedAt, scheduledAt: null } as any,
      null,
    );

    this.events.emit(
      CMS_DOMAIN_EVENTS.CONTENT_PUBLISHED,
      new ContentPublishedEvent(entityType, entity.id, siteId, null, publishedAt),
    );

    await this.auditService.record({
      schoolId: null,
      userId: null,
      action: AuditAction.CMS_CONTENT_PUBLISHED,
      entityType,
      entityId: entity.id,
      newValue: { status: entity.status, publishedAt: entity.publishedAt },
    });

    return entity;
  }

  /**
   * `ScheduledPublishCron`'s entry point. Site-agnostic by construction:
   * it scans every registered content type's `SCHEDULED` rows across all
   * Sites (not just one), same as the architecture doc calls for. A
   * failure publishing one row is logged and skipped rather than
   * aborting the whole run, so one bad row doesn't block every other
   * Site's/content type's scheduled publishes in the same tick.
   */
  async runScheduledPublish(now: Date = new Date()): Promise<number> {
    let publishedCount = 0;

    for (const { entityType, repository, contentService } of this.registrations.values()) {
      const dueRows = await repository.find({
        where: { status: ContentStatus.SCHEDULED, scheduledAt: LessThanOrEqual(now) } as any,
      });

      for (const row of dueRows) {
        try {
          await this.publishScheduled(contentService, entityType, row.siteId, row.id);
          publishedCount += 1;
        } catch (err) {
          this.logger.error(
            `Scheduled publish failed for ${entityType}:${row.id} (site ${row.siteId})`,
            err as Error,
          );
        }
      }
    }

    return publishedCount;
  }
}
