"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmsSimpleContent1738100000000 = void 0;
class CmsSimpleContent1738100000000 {
    constructor() {
        this.name = 'CmsSimpleContent1738100000000';
    }
    async up(queryRunner) {
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
    async down(queryRunner) {
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
exports.CmsSimpleContent1738100000000 = CmsSimpleContent1738100000000;
//# sourceMappingURL=1738100000000-CmsSimpleContent.js.map