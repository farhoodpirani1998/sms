import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProofBlock } from './entities/proof-block.entity';
import { BaseContentService } from '../../common/services/base-content.service';
import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';
import { RevisionsService } from '../../core/revisions/revisions.service';
import { PublishingService } from '../../core/publishing/publishing.service';
import { OrderingService } from '../../core/ordering/ordering.service';

/**
 * `ProofBlockService` — CMS-C.5. Extends `BaseContentService` exactly the
 * way its doc comment prescribes (repository + `CmsEntityType.PROOF_BLOCK`
 * + `RevisionsService` + `EventEmitter2` into `super()`), then adds the
 * three thin wrappers every real `content/*` service (CMS-D onward) will
 * also need on top of the base class: `publish`/`unpublish`/`schedule`
 * delegating to `PublishingService` (CMS-C.4), `reorder` delegating to
 * `OrderingService` (CMS-C.4), and `restore` delegating to
 * `RevisionsService.restore()` (CMS-C.2).
 *
 * `restore()` deliberately lives here, not on `BaseContentService` or
 * `RevisionsService` — `RevisionsService.restore()` (CMS-C.2) validates
 * the revision and hands back its stored `snapshot`, but has no content
 * table to write to at that sub-phase (see its own doc comment). Writing
 * the snapshot back onto a live row needs a concrete entity shape (which
 * fields are safe to reapply), so it's implemented per content type —
 * here, only `title`/`body` are restored, not lifecycle fields
 * (`status`/`publishedAt`/`scheduledAt`/`sortOrder`): a revision rolls
 * back editorial content, not the publish/ordering state, which stay
 * `PublishingService`'s/`OrderingService`'s concern respectively — same
 * separation `BaseContentService.applyStatusTransition()`'s doc comment
 * already draws between "what changed on the row" and "who decided it
 * should change". Restoring calls `update()` underneath, so it's itself
 * a new edit — a new revision is snapshotted, and history is never
 * destructively rewritten, matching `RevisionsService.restore()`'s own
 * doc comment.
 *
 * Registers itself with `PublishingService` from `onModuleInit()` so the
 * scheduled-publish cron (CMS-C.4) can scan `ProofBlock`'s `SCHEDULED`
 * rows the same way it will scan every real content type from CMS-D
 * onward (see `PublishingService.registerSchedulable()`'s doc comment).
 */
@Injectable()
export class ProofBlockService extends BaseContentService<ProofBlock> implements OnModuleInit {
  constructor(
    @InjectRepository(ProofBlock)
    repository: Repository<ProofBlock>,
    revisionsService: RevisionsService,
    events: EventEmitter2,
    private readonly publishingService: PublishingService,
    private readonly orderingService: OrderingService,
  ) {
    super(repository, CmsEntityType.PROOF_BLOCK, revisionsService, events);
  }

  onModuleInit(): void {
    this.publishingService.registerSchedulable({
      entityType: this.entityType,
      repository: this.repository,
      contentService: this,
    });
  }

  async publish(siteId: string, id: string, userId: string): Promise<ProofBlock> {
    return this.publishingService.publish(this, this.entityType, siteId, id, userId);
  }

  async unpublish(siteId: string, id: string, userId: string): Promise<ProofBlock> {
    return this.publishingService.unpublish(this, this.entityType, siteId, id, userId);
  }

  async schedule(
    siteId: string,
    id: string,
    scheduledAt: Date,
    userId: string,
  ): Promise<ProofBlock> {
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
  ): Promise<ProofBlock> {
    const revision = await this.revisionsService.restore(this.entityType, id, revisionId, userId);

    // `RevisionsService.restore()` only matches on (entityType, entityId,
    // revisionId) — it has no `siteId` to scope by (CMS-C.2 predates any
    // real content table). Re-checking here keeps this method honoring
    // the same "never trust a bare id, always confirm it belongs to the
    // caller's Site" rule every other method on this class follows.
    if (revision.siteId !== siteId) {
      throw new NotFoundException('Revision not found');
    }

    const snapshot = revision.snapshot as Partial<ProofBlock>;
    return this.update(
      siteId,
      id,
      { title: snapshot.title, body: snapshot.body ?? null } as DeepPartial<ProofBlock>,
      userId,
    );
  }
}
