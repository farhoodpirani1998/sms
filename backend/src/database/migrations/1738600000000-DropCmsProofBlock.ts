import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CMS handoff cleanup — drops `cms.proof_blocks`, the disposable table
 * `1738000000000-CmsProofBlock.ts` (CMS-C.5) created to back the
 * throwaway `ProofBlock` entity (`src/modules/cms/content/_proof/`).
 *
 * That entity's own doc comments, and `cms.module.ts`'s, always framed
 * it as scaffolding: proof that the cross-cutting stack
 * (`BaseContentService`/`RevisionsService`/`PublishingService`/
 * `OrderingService`/CMS domain events/`AuditService`) composed correctly
 * end-to-end, to be removed once real content types existed to serve as
 * the reference instead. Now that all 14 real content types (CMS-D
 * through CMS-H) are built, `ProofBlockModule` and everything under
 * `content/_proof/` have been deleted — this migration is the matching
 * schema cleanup.
 *
 * Deliberately a new migration rather than an edit to
 * `1738000000000-CmsProofBlock.ts` itself: that migration already ran
 * (or may have already run) against real databases, so its `up()`/
 * `down()` stay as-is for history; `down()` here simply re-runs what
 * `down()` already did for CMS-C.5 (kept in that migration precisely
 * "for that eventual cleanup", per its doc comment), while `down()` for
 * *this* migration recreates the table verbatim from that same
 * migration's `up()`, so this pair remains fully reversible on its own.
 */
export class DropCmsProofBlock1738600000000 implements MigrationInterface {
  name = 'DropCmsProofBlock1738600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS cms.idx_cms_proof_blocks_scheduled;
      DROP INDEX IF EXISTS cms.idx_cms_proof_blocks_site_order;
      DROP TABLE IF EXISTS cms.proof_blocks;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE cms.proof_blocks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms.sites(id),
        sort_order INT NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'in_review', 'scheduled', 'published', 'archived')),
        published_at TIMESTAMPTZ,
        scheduled_at TIMESTAMPTZ,
        title JSONB NOT NULL,
        body JSONB,
        created_by_id UUID,
        updated_by_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_cms_proof_blocks_site_order
        ON cms.proof_blocks(site_id, sort_order);

      CREATE INDEX idx_cms_proof_blocks_scheduled
        ON cms.proof_blocks(status, scheduled_at)
        WHERE status = 'scheduled';
    `);
  }
}
