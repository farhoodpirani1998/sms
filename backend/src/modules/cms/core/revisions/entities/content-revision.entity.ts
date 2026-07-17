import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { CmsEntityType } from '../../../common/enums/cms-entity-type.enum';

/**
 * `ContentRevision` — CMS-C.1. Generic snapshot row: one per
 * create/update of any CMS content type, keyed by (`entityType`,
 * `entityId`) rather than a dedicated table per content type — this is
 * what lets `RevisionsService` (CMS-C.2) and its
 * `GET /cms/:entityType/:id/revisions` / `.../restore` endpoints stay
 * generic instead of being copy-pasted 14 times for CMS-D through CMS-H.
 *
 * `entityType` is stored as `varchar`, not a Postgres native enum type —
 * matching every other enum-shaped column already in this codebase (none
 * use `CREATE TYPE`) — so adding a new `CmsEntityType` member as each
 * later content type lands never requires an `ALTER TYPE` migration here.
 *
 * `snapshot` is the full entity payload at the moment of the
 * create/update that triggered this revision, stored as `jsonb` so it
 * can hold any content type's shape without a schema change. No FK from
 * `entity_id` to any specific content table — same cross-schema/
 * cross-shape reasoning as `MediaAsset.uploadedById` (see that entity's
 * doc comment): a single revisions table can't FK to 14 different
 * possible target tables.
 *
 * `site_id` IS a real FK to `cms.sites` (both live in the `cms` schema
 * already, same as `MediaAsset`), so a bad/removed Site can't leave
 * orphaned revisions with no owning tenant.
 *
 * No logic yet (`RevisionsService`, controller, restore) — those land in
 * CMS-C.2. This sub-phase only creates the table, the entity, and the
 * event vocabulary (`cms-domain-events.ts`).
 */
@Entity({ name: 'content_revisions', schema: 'cms' })
export class ContentRevision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'site_id' })
  siteId: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 50 })
  entityType: CmsEntityType;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ type: 'jsonb' })
  snapshot: Record<string, unknown>;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
