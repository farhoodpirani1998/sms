import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CMS-C.1 — Publishing + Revisions + Events, step 1 of 5.
 *
 * Creates `cms.content_revisions`, the single generic revisions table
 * every content type (CMS-D through CMS-H) will snapshot into via
 * `RevisionsService` (CMS-C.2) — see `ContentRevision`'s own doc comment
 * for why this is one shared table keyed by (`entity_type`, `entity_id`)
 * rather than one table per content type.
 *
 * `entity_type` is `VARCHAR(50)`, not a Postgres native enum — no
 * existing migration in this repo uses `CREATE TYPE` for an enum-shaped
 * column, so this follows that convention; it also means adding a new
 * `CmsEntityType` member later (one per content sub-phase) never
 * requires an `ALTER TYPE` here.
 *
 * The composite index supports the read pattern CMS-C.2's
 * `GET /cms/:entityType/:id/revisions` needs: all revisions for one
 * entity, most recent first.
 *
 * No logic (`RevisionsService`, restore) lands until CMS-C.2 — this
 * migration only creates the table.
 */
export class CmsRevisions1737900000000 implements MigrationInterface {
  name = 'CmsRevisions1737900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE cms.content_revisions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms.sites(id),
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        snapshot JSONB NOT NULL,
        created_by_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_cms_content_revisions_entity
        ON cms.content_revisions(entity_type, entity_id, created_at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS cms.idx_cms_content_revisions_entity;
      DROP TABLE IF EXISTS cms.content_revisions;
    `);
  }
}
