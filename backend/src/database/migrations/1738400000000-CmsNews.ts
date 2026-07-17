import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CMS-G.1 — News core (CRUD, admin). Creates `cms.news_articles`,
 * mirroring `cms.pages` (CMS-F.1) column-for-column: same
 * `BaseCmsEntity` shape (id, site_id, sort_order, status + CHECK,
 * published_at, scheduled_at, audit columns, same two indexes for
 * ordered listing and the scheduled-publish cron's scan), same
 * `UNIQUE (site_id, slug)` public-facing slug, and the same embedded
 * SEO columns (`meta_title`, `meta_description`) Pages introduced.
 *
 * The one naming difference from Pages: the image FK column here is
 * `cover_media_id` rather than `og_image_media_id` — News reuses the
 * `coverMediaId` convention `hero`/`about`/`features` already
 * established (CMS-D), per this sub-phase's roadmap dependency note,
 * rather than Pages' SEO-specific naming. `core/seo/`'s
 * `ResolvedSeoMeta` (CMS-G.2) resolves `ogImageUrl` from this same
 * column, same as it does from `Page.ogImageMediaId`.
 *
 * `body` is `jsonb` (localized rich-text-or-plain per locale), same
 * `LocalizedText` convention as every other translated column.
 */
export class CmsNews1738400000000 implements MigrationInterface {
  name = 'CmsNews1738400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE cms.news_articles (
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
        cover_media_id UUID REFERENCES cms.media_assets(id),
        created_by_id UUID,
        updated_by_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_cms_news_articles_site_slug UNIQUE (site_id, slug)
      );

      CREATE INDEX idx_cms_news_articles_site_order
        ON cms.news_articles(site_id, sort_order);

      CREATE INDEX idx_cms_news_articles_scheduled
        ON cms.news_articles(status, scheduled_at)
        WHERE status = 'scheduled';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS cms.idx_cms_news_articles_scheduled;
      DROP INDEX IF EXISTS cms.idx_cms_news_articles_site_order;
      DROP TABLE IF EXISTS cms.news_articles;
    `);
  }
}
