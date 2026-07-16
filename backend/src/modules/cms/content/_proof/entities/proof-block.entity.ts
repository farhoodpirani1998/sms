import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseCmsEntity } from '../../../common/entities/base-cms.entity';
import { Site } from '../../../core/site/entities/site.entity';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `ProofBlock` — CMS-C.5. Disposable content type used only to prove
 * `BaseCmsEntity`/`BaseContentService`/`RevisionsService`/
 * `PublishingService`/`OrderingService` all compose correctly against a
 * real table before 14 real content types (CMS-D onward) copy this same
 * shape. Field list is deliberately minimal — one required localized
 * field (`title`) and one optional one (`body`) is enough to exercise
 * create/update/publish/revision-restore/reorder; there's nothing
 * `ProofBlock`-specific to model beyond that.
 *
 * Follows the exact extension shape docs/architecture/CMS_ARCHITECTURE.md
 * §4.1 lays out for every concrete content type: extends `BaseCmsEntity`
 * for id/siteId/sortOrder/status/publishedAt/scheduledAt/audit columns,
 * adds its own `@ManyToOne(() => Site)` relation on `site_id` (the base
 * class only declares the bare column, not the relation — see that
 * class's doc comment), and its own fields as `jsonb`.
 *
 * Per CMS-C.5's roadmap entry: recommend deleting this entire `_proof`
 * module (entity, dto, service, module, and the `cms.module.ts` import)
 * before CMS-D.1 starts, once the handoff report confirms the
 * cross-cutting stack needed no changes. Left in place for now — CMS-C.5
 * itself only proves the pipeline, it doesn't clean up after itself.
 */
@Entity({ name: 'proof_blocks', schema: 'cms' })
export class ProofBlock extends BaseCmsEntity {
  @ManyToOne(() => Site)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'jsonb' })
  title: LocalizedText;

  @Column({ type: 'jsonb', nullable: true })
  body: LocalizedText | null;
}
