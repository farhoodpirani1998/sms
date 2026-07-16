import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CMS-A.1 — Foundation, step 2 of 2.
 *
 * Creates `cms.sites` and seeds exactly one row (NHG). Per
 * docs/architecture/CMS_ARCHITECTURE.md §2/§6: `Site` is a pure
 * content-partition concept owned entirely by the CMS bounded context —
 * no column, join, or FK to `schools`/`school_id` anywhere on this table.
 * Adding a second Site later is a data insert (new `domain` row), not a
 * schema or code change.
 *
 * `domain` is unique/indexed and is what the public API's Host-header
 * resolver (CMS-I, later phase) will use to find a Site. The seeded value
 * below is a placeholder — update it to the real production host before
 * the public API phase relies on it.
 *
 * `theme` / `social_links` / `seo_defaults` are left NULL on the seed row;
 * they're deliberately `jsonb` so Site-level config can grow without
 * future migrations (§2).
 */
export class CmsSite1737700000000 implements MigrationInterface {
  name = 'CmsSite1737700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE cms.sites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        domain VARCHAR(255) NOT NULL UNIQUE,
        default_locale VARCHAR(10) NOT NULL DEFAULT 'en',
        supported_locales JSONB NOT NULL DEFAULT '["en"]',
        theme JSONB,
        social_links JSONB,
        seo_defaults JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      INSERT INTO cms.sites (name, domain, default_locale, supported_locales)
      VALUES ('NHG', 'nhg.example.com', 'en', '["en", "fa"]');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS cms.sites`);
  }
}
