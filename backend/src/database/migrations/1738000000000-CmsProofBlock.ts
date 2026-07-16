import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CMS-C.5 — Throwaway proof entity, wired end-to-end.
 *
 * Creates `cms.proof_blocks`, the disposable table backing `ProofBlock`
 * (`src/modules/cms/content/_proof/`) — the one concrete `BaseCmsEntity`
 * subclass CMS-C.5 uses to prove the full CRUD → revision snapshot →
 * publish → event → audit pipeline before 14 real content types copy the
 * pattern starting at CMS-D.1. Column list is exactly `BaseCmsEntity`
 * (id, site_id, sort_order, status, published_at, scheduled_at,
 * created_by_id, updated_by_id, created_at, updated_at) plus two
 * `ProofBlock`-only fields (`title`, `body`) — no other concrete content
 * type has landed yet, so this is also the first migration to actually
 * instantiate `BaseCmsEntity`'s shape as a real table.
 *
 * `status` is `VARCHAR(20)`, not a Postgres native enum — same "no
 * `CREATE TYPE` for an enum-shaped column" convention `CmsRevisions`
 * (`entity_type`) already established for this module; adding new
 * `ContentStatus` members later never needs an `ALTER TYPE` here. A
 * `CHECK` constraint keeps the column honest without a native enum type.
 *
 * `title`/`body` are `jsonb` (`LocalizedText` — CMS-C.3), matching the
 * `NewsArticle` example in docs/architecture/CMS_ARCHITECTURE.md §4.1.
 * `title` is required (a block needs at least a name in one locale);
 * `body` is optional, since CMS-C.5 only needs one localized field to
 * prove the pattern and a second to prove the shape generalizes.
 *
 * Per the roadmap, this table — and the whole `_proof` module — is
 * scaffolding: expected to be dropped once CMS-D.1 lands and the
 * cross-cutting stack has a real content type to exercise it instead.
 * This migration intentionally is NOT reverted as part of CMS-C.5 itself
 * (the module stays registered until a later phase explicitly removes
 * it), so `down()` is still provided for that eventual cleanup.
 */
export class CmsProofBlock1738000000000 implements MigrationInterface {
  name = 'CmsProofBlock1738000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS cms.idx_cms_proof_blocks_scheduled;
      DROP INDEX IF EXISTS cms.idx_cms_proof_blocks_site_order;
      DROP TABLE IF EXISTS cms.proof_blocks;
    `);
  }
}
