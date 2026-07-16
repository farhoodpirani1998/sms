import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CMS-D.1 — Migration (all 6 tables) + Hero (reference implementation).
 *
 * Creates the six `cms.*` tables backing the "simple content" group
 * (§8 CMS-D of the architecture doc's suggested phasing): hero, about,
 * cta, statistics, features, faq. Per the roadmap, all six share one
 * migration file created once here — D.2–D.6 build entity/service/
 * controller code against the tables already created by this migration,
 * they do not add their own.
 *
 * Every table follows the exact `BaseCmsEntity` column shape
 * `CmsProofBlock` (CMS-C.5) established as the first real instantiation
 * of that shape: id, site_id (FK -> cms.sites), sort_order, status
 * (VARCHAR(20) + CHECK, not a native enum — same convention `CmsRevisions`
 * / `CmsProofBlock` already use so a future `ContentStatus` member never
 * needs an `ALTER TYPE` here), published_at, scheduled_at, created_by_id,
 * updated_by_id, created_at, updated_at — plus each table's own fields.
 * Same two indexes per table as `CmsProofBlock` (site_id+sort_order for
 * ordered admin/public listing, a partial status+scheduled_at index for
 * the scheduled-publish cron's scan).
 *
 * `cover_media_id` (hero/about/features) and no equivalent on cta/
 * statistics/faq: only the three types that plausibly show a background/
 * illustrative image reference `cms.media_assets`, matching the
 * `coverMediaId` convention the roadmap calls out for News (CMS-G.1).
 * The FK has no `ON DELETE` action beyond Postgres's default (RESTRICT)
 * — deleting a MediaAsset still referenced by published content is a
 * mistake the DB should catch, not silently null out.
 *
 * Only `hero` gets an entity/service/controller in this sub-phase (see
 * `content/hero/`) — the other five tables sit unused until D.2–D.6 land,
 * same as `MediaAsset`'s table existed a full sub-phase (CMS-B.1) before
 * any logic used it.
 */
export class CmsSimpleContent1738100000000 implements MigrationInterface {
  name = 'CmsSimpleContent1738100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE cms.hero_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms.sites(id),
        sort_order INT NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'in_review', 'scheduled', 'published', 'archived')),
        published_at TIMESTAMPTZ,
        scheduled_at TIMESTAMPTZ,
        title JSONB NOT NULL,
        subtitle JSONB,
        cta_label JSONB,
        cta_url VARCHAR(2000),
        cover_media_id UUID REFERENCES cms.media_assets(id),
        created_by_id UUID,
        updated_by_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_cms_hero_items_site_order
        ON cms.hero_items(site_id, sort_order);

      CREATE INDEX idx_cms_hero_items_scheduled
        ON cms.hero_items(status, scheduled_at)
        WHERE status = 'scheduled';

      CREATE TABLE cms.about_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms.sites(id),
        sort_order INT NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'in_review', 'scheduled', 'published', 'archived')),
        published_at TIMESTAMPTZ,
        scheduled_at TIMESTAMPTZ,
        title JSONB NOT NULL,
        body JSONB,
        cover_media_id UUID REFERENCES cms.media_assets(id),
        created_by_id UUID,
        updated_by_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_cms_about_items_site_order
        ON cms.about_items(site_id, sort_order);

      CREATE INDEX idx_cms_about_items_scheduled
        ON cms.about_items(status, scheduled_at)
        WHERE status = 'scheduled';

      CREATE TABLE cms.cta_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms.sites(id),
        sort_order INT NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'in_review', 'scheduled', 'published', 'archived')),
        published_at TIMESTAMPTZ,
        scheduled_at TIMESTAMPTZ,
        title JSONB NOT NULL,
        body JSONB,
        button_label JSONB,
        button_url VARCHAR(2000),
        created_by_id UUID,
        updated_by_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_cms_cta_items_site_order
        ON cms.cta_items(site_id, sort_order);

      CREATE INDEX idx_cms_cta_items_scheduled
        ON cms.cta_items(status, scheduled_at)
        WHERE status = 'scheduled';

      CREATE TABLE cms.statistics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms.sites(id),
        sort_order INT NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'in_review', 'scheduled', 'published', 'archived')),
        published_at TIMESTAMPTZ,
        scheduled_at TIMESTAMPTZ,
        label JSONB NOT NULL,
        value VARCHAR(50) NOT NULL,
        icon VARCHAR(100),
        created_by_id UUID,
        updated_by_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_cms_statistics_site_order
        ON cms.statistics(site_id, sort_order);

      CREATE INDEX idx_cms_statistics_scheduled
        ON cms.statistics(status, scheduled_at)
        WHERE status = 'scheduled';

      CREATE TABLE cms.features (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms.sites(id),
        sort_order INT NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'in_review', 'scheduled', 'published', 'archived')),
        published_at TIMESTAMPTZ,
        scheduled_at TIMESTAMPTZ,
        title JSONB NOT NULL,
        description JSONB,
        icon VARCHAR(100),
        cover_media_id UUID REFERENCES cms.media_assets(id),
        created_by_id UUID,
        updated_by_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_cms_features_site_order
        ON cms.features(site_id, sort_order);

      CREATE INDEX idx_cms_features_scheduled
        ON cms.features(status, scheduled_at)
        WHERE status = 'scheduled';

      CREATE TABLE cms.faqs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms.sites(id),
        sort_order INT NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'in_review', 'scheduled', 'published', 'archived')),
        published_at TIMESTAMPTZ,
        scheduled_at TIMESTAMPTZ,
        question JSONB NOT NULL,
        answer JSONB NOT NULL,
        created_by_id UUID,
        updated_by_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_cms_faqs_site_order
        ON cms.faqs(site_id, sort_order);

      CREATE INDEX idx_cms_faqs_scheduled
        ON cms.faqs(status, scheduled_at)
        WHERE status = 'scheduled';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS cms.idx_cms_faqs_scheduled;
      DROP INDEX IF EXISTS cms.idx_cms_faqs_site_order;
      DROP TABLE IF EXISTS cms.faqs;

      DROP INDEX IF EXISTS cms.idx_cms_features_scheduled;
      DROP INDEX IF EXISTS cms.idx_cms_features_site_order;
      DROP TABLE IF EXISTS cms.features;

      DROP INDEX IF EXISTS cms.idx_cms_statistics_scheduled;
      DROP INDEX IF EXISTS cms.idx_cms_statistics_site_order;
      DROP TABLE IF EXISTS cms.statistics;

      DROP INDEX IF EXISTS cms.idx_cms_cta_items_scheduled;
      DROP INDEX IF EXISTS cms.idx_cms_cta_items_site_order;
      DROP TABLE IF EXISTS cms.cta_items;

      DROP INDEX IF EXISTS cms.idx_cms_about_items_scheduled;
      DROP INDEX IF EXISTS cms.idx_cms_about_items_site_order;
      DROP TABLE IF EXISTS cms.about_items;

      DROP INDEX IF EXISTS cms.idx_cms_hero_items_scheduled;
      DROP INDEX IF EXISTS cms.idx_cms_hero_items_site_order;
      DROP TABLE IF EXISTS cms.hero_items;
    `);
  }
}
