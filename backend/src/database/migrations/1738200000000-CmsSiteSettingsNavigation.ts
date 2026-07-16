import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CMS-E.1 — Site Settings (singleton content type). Creates both tables
 * the roadmap's CMS-E group needs: `cms.site_settings` (this sub-phase)
 * and `cms.navigation_items` (logic lands in CMS-E.2, but per the
 * roadmap's file list both tables share this one migration, same
 * "create once, build against it over several sub-phases" pattern
 * `CmsSimpleContent` (CMS-D.1) established for hero/about/cta/
 * statistics/features/faq).
 *
 * `cms.site_settings` follows the same `BaseCmsEntity` column shape
 * every CMS-D table uses (id, site_id, sort_order, status + CHECK,
 * published_at, scheduled_at, audit columns), but adds a UNIQUE
 * constraint on `site_id` — the enforcement point for "this is a
 * singleton per Site", per `SiteSettingsService`'s get-or-create doc
 * comment. `sort_order` has no operational meaning here (a singleton
 * doesn't get reordered) but is kept for shape-consistency with
 * `BaseCmsEntity`/`BaseContentService`, same as every CMS-D table.
 *
 * Fields deliberately don't repeat anything `Site` (CMS-A.2) already
 * owns (name/domain/locales/theme/socialLinks/seoDefaults) — Site
 * Settings covers site-wide *content* an editor drafts/publishes/
 * revises (footer text, contact details, copyright, a maintenance
 * banner, an analytics id), whereas `Site`'s own columns are core
 * tenancy/branding config with no publish workflow.
 *
 * `cms.navigation_items` is self-referencing via `parent_id` (nullable
 * FK to its own table) for the menu tree `NavigationService` (CMS-E.2)
 * assembles. Same `BaseCmsEntity` shape plus `label`/`url`/`parent_id`.
 * `ON DELETE CASCADE` on `parent_id` (unlike `cover_media_id`'s RESTRICT
 * in CMS-D's migration) since deleting a parent menu item should also
 * remove its children — an orphaned child pointing at a deleted parent
 * has no sensible tree position.
 */
export class CmsSiteSettingsNavigation1738200000000 implements MigrationInterface {
  name = 'CmsSiteSettingsNavigation1738200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE cms.site_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL UNIQUE REFERENCES cms.sites(id),
        sort_order INT NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'in_review', 'scheduled', 'published', 'archived')),
        published_at TIMESTAMPTZ,
        scheduled_at TIMESTAMPTZ,
        footer_text JSONB,
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        contact_address JSONB,
        copyright_text JSONB,
        maintenance_mode BOOLEAN NOT NULL DEFAULT false,
        analytics_id VARCHAR(100),
        created_by_id UUID,
        updated_by_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_cms_site_settings_scheduled
        ON cms.site_settings(status, scheduled_at)
        WHERE status = 'scheduled';

      CREATE TABLE cms.navigation_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms.sites(id),
        parent_id UUID REFERENCES cms.navigation_items(id) ON DELETE CASCADE,
        sort_order INT NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'in_review', 'scheduled', 'published', 'archived')),
        published_at TIMESTAMPTZ,
        scheduled_at TIMESTAMPTZ,
        label JSONB NOT NULL,
        url VARCHAR(2000),
        created_by_id UUID,
        updated_by_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_cms_navigation_items_site_order
        ON cms.navigation_items(site_id, sort_order);

      CREATE INDEX idx_cms_navigation_items_parent
        ON cms.navigation_items(parent_id);

      CREATE INDEX idx_cms_navigation_items_scheduled
        ON cms.navigation_items(status, scheduled_at)
        WHERE status = 'scheduled';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS cms.idx_cms_navigation_items_scheduled;
      DROP INDEX IF EXISTS cms.idx_cms_navigation_items_parent;
      DROP INDEX IF EXISTS cms.idx_cms_navigation_items_site_order;
      DROP TABLE IF EXISTS cms.navigation_items;

      DROP INDEX IF EXISTS cms.idx_cms_site_settings_scheduled;
      DROP TABLE IF EXISTS cms.site_settings;
    `);
  }
}
