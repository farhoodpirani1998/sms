import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CMS-B.1 — Media, step 1.
 *
 * Creates `cms.media_assets`. Field list matches
 * docs/architecture/CMS_ARCHITECTURE.md §4.7 exactly: id, site_id,
 * original_filename, mime_type, size_bytes, storage_key, url, width,
 * height, alt_text, uploaded_by_id, created_at.
 *
 * `site_id` is a real FK to `cms.sites` (unlike some existing
 * school-scoped tables that store the tenant id bare) since both tables
 * already live in the same `cms` schema and Site is the CMS bounded
 * context's own scoping key — see CmsSite migration and
 * docs/architecture/CMS_ARCHITECTURE.md §2.
 *
 * `uploaded_by_id` intentionally has no FK constraint to `users` — same
 * pattern `student_documents.uploaded_by` and `BaseCmsEntity.createdById`
 * use elsewhere in this codebase, since Users lives in a different schema
 * than `cms` and this repo doesn't do cross-schema FKs.
 *
 * No logic (StorageProvider, upload endpoint) lands until CMS-B.2 through
 * CMS-B.4 — this migration only creates the table.
 */
export class CmsMedia1737800000000 implements MigrationInterface {
  name = 'CmsMedia1737800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE cms.media_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms.sites(id),
        original_filename VARCHAR(255) NOT NULL,
        mime_type VARCHAR(127) NOT NULL,
        size_bytes BIGINT NOT NULL,
        storage_key VARCHAR(500) NOT NULL,
        url VARCHAR(1000) NOT NULL,
        width INT,
        height INT,
        alt_text VARCHAR(500),
        uploaded_by_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_cms_media_assets_site
        ON cms.media_assets(site_id, created_at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS cms.idx_cms_media_assets_site;
      DROP TABLE IF EXISTS cms.media_assets;
    `);
  }
}
