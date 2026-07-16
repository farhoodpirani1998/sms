import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ContentRevision } from './entities/content-revision.entity';
import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';
import { CMS_DOMAIN_EVENTS, RevisionRestoredEvent } from '../events/cms-domain-events';

/**
 * `RevisionsService` — CMS-C.2. Generic over `CmsEntityType`, so it's
 * called from `BaseContentService` (CMS-C.3) rather than reimplemented
 * per content type — this sub-phase proves the generic snapshot/list/
 * restore behavior directly against `ContentRevision`, with no real
 * content type wired in yet (that proof happens in CMS-C.5).
 *
 * `restore()` deliberately does not — and cannot, at this sub-phase —
 * write the snapshot back onto a live content row: there is no content
 * table to write to yet. It validates the revision exists and belongs to
 * the given (entityType, entityId, siteId), emits `REVISION_RESTORED`,
 * and hands back the stored `snapshot`. `BaseContentService.restore()`
 * (CMS-C.3) is what will take that returned snapshot and `Object.assign`
 * it onto the real entity, save it, and snapshot *that* as a new
 * revision — the same "restoring is itself a new edit" pattern most CMSs
 * use, so history is never destructively rewritten.
 */
@Injectable()
export class RevisionsService {
  constructor(
    @InjectRepository(ContentRevision)
    private readonly revisionRepository: Repository<ContentRevision>,
    private readonly events: EventEmitter2,
  ) {}

  /**
   * Snapshots the current state of a content row. Called by
   * `BaseContentService` (CMS-C.3) after every create/update — not by
   * any controller directly, hence no HTTP endpoint for this one.
   */
  async snapshot(
    entityType: CmsEntityType,
    entityId: string,
    siteId: string,
    payload: Record<string, unknown>,
    createdById: string | null,
  ): Promise<ContentRevision> {
    const revision = this.revisionRepository.create({
      entityType,
      entityId,
      siteId,
      snapshot: payload,
      createdById,
    });
    return this.revisionRepository.save(revision);
  }

  /** `GET /cms/:entityType/:id/revisions` — most recent first. */
  async list(entityType: string, entityId: string): Promise<ContentRevision[]> {
    const validEntityType = this.assertValidEntityType(entityType);
    return this.revisionRepository.find({
      where: { entityType: validEntityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * `POST /cms/:entityType/:id/revisions/restore`. Validates the
   * revision exists and matches the (entityType, entityId) in the URL —
   * a revision id from a different entity, even a real one, is treated
   * as not found rather than silently restoring the wrong content — then
   * emits `REVISION_RESTORED` and returns the stored snapshot.
   */
  async restore(
    entityType: string,
    entityId: string,
    revisionId: string,
    performedBy: string,
  ): Promise<ContentRevision> {
    const validEntityType = this.assertValidEntityType(entityType);

    const revision = await this.revisionRepository.findOne({
      where: { id: revisionId, entityType: validEntityType, entityId },
    });
    if (!revision) {
      throw new NotFoundException('Revision not found');
    }

    this.events.emit(
      CMS_DOMAIN_EVENTS.REVISION_RESTORED,
      new RevisionRestoredEvent(validEntityType, entityId, revision.siteId, revision.id, performedBy),
    );

    return revision;
  }

  // `entityType` arrives as a raw URL segment, so it's validated against
  // the closed `CmsEntityType` set here rather than trusted as-is — a
  // typo'd or made-up entity type should 400, not silently match zero
  // rows and look like an empty-but-valid history.
  private assertValidEntityType(entityType: string): CmsEntityType {
    const values = Object.values(CmsEntityType) as string[];
    if (!values.includes(entityType)) {
      throw new BadRequestException(`Unknown CMS entity type: ${entityType}`);
    }
    return entityType as CmsEntityType;
  }
}
