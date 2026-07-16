import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';

/**
 * CMS Domain Events — CMS-C.1.
 *
 * Same pattern as `common/events/domain-events.ts` (plain classes carrying
 * "something happened", emitted via `@nestjs/event-emitter`'s
 * `EventEmitter2` — see that file's doc comment for the full rationale).
 * Kept as a separate, CMS-scoped file rather than added to the shared one:
 * `CmsModule` must never import from `modules/school/*`, and the reverse
 * bounded-context rule applies too — CMS's own event vocabulary stays
 * inside `modules/cms/*` so nothing outside this module needs to know it
 * exists yet.
 *
 * This sub-phase only defines the vocabulary — no service emits or
 * listens to these yet. `PublishingService`/`OrderingService` (CMS-C.4)
 * are the first emitters; `RevisionsService` (CMS-C.2) fires
 * `REVISION_RESTORED`; the cache-invalidation listener (CMS-I.2)
 * subscribes to `CONTENT_PUBLISHED`/`CONTENT_UNPUBLISHED`/
 * `CONTENT_UPDATED`. Every event carries `entityType` (the closed
 * `CmsEntityType` set — see that enum's own doc comment) and `entityId`
 * rather than a type-specific event per content type, since
 * `BaseContentService` (CMS-C.3) is itself generic over entity type and
 * shouldn't need a new event class for every one of the 14 content types
 * CMS-D through CMS-H add.
 */

export const CMS_DOMAIN_EVENTS = {
  CONTENT_CREATED: 'cms.content.created',
  CONTENT_UPDATED: 'cms.content.updated',
  CONTENT_DELETED: 'cms.content.deleted',
  CONTENT_PUBLISHED: 'cms.content.published',
  CONTENT_UNPUBLISHED: 'cms.content.unpublished',
  CONTENT_SCHEDULED: 'cms.content.scheduled',
  CONTENT_REORDERED: 'cms.content.reordered',
  REVISION_RESTORED: 'cms.revision.restored',
} as const;

export class ContentCreatedEvent {
  constructor(
    public readonly entityType: CmsEntityType,
    public readonly entityId: string,
    public readonly siteId: string,
    public readonly performedBy: string,
  ) {}
}

export class ContentUpdatedEvent {
  constructor(
    public readonly entityType: CmsEntityType,
    public readonly entityId: string,
    public readonly siteId: string,
    public readonly performedBy: string,
  ) {}
}

export class ContentDeletedEvent {
  constructor(
    public readonly entityType: CmsEntityType,
    public readonly entityId: string,
    public readonly siteId: string,
    public readonly performedBy: string,
  ) {}
}

/**
 * Emitted by `PublishingService.publish()` (CMS-C.4) — both for an
 * immediate publish and for a scheduled publish once the cron flips a
 * `SCHEDULED` row to `PUBLISHED`. `publishedAt` is carried explicitly
 * (rather than left for a listener to re-derive) since scheduled
 * publishes happen outside the original request/response cycle.
 */
export class ContentPublishedEvent {
  constructor(
    public readonly entityType: CmsEntityType,
    public readonly entityId: string,
    public readonly siteId: string,
    public readonly performedBy: string | null, // null when the scheduler/cron did it
    public readonly publishedAt: Date,
  ) {}
}

export class ContentUnpublishedEvent {
  constructor(
    public readonly entityType: CmsEntityType,
    public readonly entityId: string,
    public readonly siteId: string,
    public readonly performedBy: string,
  ) {}
}

/** Emitted by `PublishingService.schedule(date)` (CMS-C.4). */
export class ContentScheduledEvent {
  constructor(
    public readonly entityType: CmsEntityType,
    public readonly entityId: string,
    public readonly siteId: string,
    public readonly performedBy: string,
    public readonly scheduledAt: Date,
  ) {}
}

/** Emitted by `OrderingService.reorder()` (CMS-C.4). */
export class ContentReorderedEvent {
  constructor(
    public readonly entityType: CmsEntityType,
    public readonly siteId: string,
    public readonly orderedIds: string[],
    public readonly performedBy: string,
  ) {}
}

/** Emitted by `RevisionsService.restore()` (CMS-C.2). */
export class RevisionRestoredEvent {
  constructor(
    public readonly entityType: CmsEntityType,
    public readonly entityId: string,
    public readonly siteId: string,
    public readonly revisionId: string,
    public readonly performedBy: string,
  ) {}
}
