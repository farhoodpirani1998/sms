import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CMS-F.1 — Pages core (CRUD, admin). Creates `cms.pages`, the first
 * table in the module with a public-facing `slug` rather than being
 * looked up only by `id` — the by-slug lookup itself is CMS-F.2's
 * public controller, but the column/constraint exists from this
 * sub-phase since the entity shape is frozen here.
 *
 * Same `BaseCmsEntity` column shape every prior CMS table uses (id,
 * site_id, sort_order, status + CHECK, published_at, scheduled_at,
 * audit columns, same two indexes for ordered listing and the
 * scheduled-publish cron's scan).
 *
 * `slug` is `UNIQUE (site_id, slug)` rather than globally unique — two
 * different Sites may each have a page at `/about`, matching every
 * other CMS table's "everything is scoped to one Site" rule. No
 * `ON DELETE` cascade concerns here since nothing yet references a Page
 * by FK.
 *
 * SEO fields are embedded directly on this table (`meta_title`,
 * `meta_description`, `og_image_media_id`) rather than waiting on a
 * shared `core/seo/` type — CMS-F.2 introduces `SeoMetaType` purely as a
 * TypeScript convenience for reading these columns consistently (Pages
 * now, News in CMS-G.2), it does not add or rename any column here.
 * `og_image_media_id` follows the same nullable bare-FK-to-`MediaAsset`
 * convention as `hero`/`about`/`features`' `cover_media_id` (RESTRICT,
 * not CASCADE, on delete).
 *
 * `body` is `jsonb` (localized rich-text-or-plain per locale, same
 * `LocalizedText` shape as every other translated column) rather than a
 * single `text` column — the architecture's i18n convention applies to
 * page body content the same as it does to `title`.
 */
export class CmsPages1738300000000 implements MigrationInterface {
  name = 'CmsPages1738300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE cms.pages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms.sites(id),
        sort_order INT NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'in_review', 'scheduled', 'published', 'archived')),
        published_at TIMESTAMPTZ,
        scheduled_at TIMESTAMPTZ,
        slug VARCHAR(255) NOT NULL,
        title JSONB NOT NULL,
        excerpt JSONB,
        body JSONB,
        meta_title JSONB,
        meta_description JSONB,
        og_image_media_id UUID REFERENCES cms.media_assets(id),
        created_by_id UUID,
        updated_by_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_cms_pages_site_slug UNIQUE (site_id, slug)
      );

      CREATE INDEX idx_cms_pages_site_order
        ON cms.pages(site_id, sort_order);

      CREATE INDEX idx_cms_pages_scheduled
        ON cms.pages(status, scheduled_at)
        WHERE status = 'scheduled';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS cms.idx_cms_pages_scheduled;
      DROP INDEX IF EXISTS cms.idx_cms_pages_site_order;
      DROP TABLE IF EXISTS cms.pages;
    `);
  }
}
