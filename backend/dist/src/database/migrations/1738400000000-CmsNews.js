"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmsNews1738400000000 = void 0;
class CmsNews1738400000000 {
    constructor() {
        this.name = 'CmsNews1738400000000';
    }
    async up(queryRunner) {
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
    async down(queryRunner) {
        await queryRunner.query(`
      DROP INDEX IF EXISTS cms.idx_cms_news_articles_scheduled;
      DROP INDEX IF EXISTS cms.idx_cms_news_articles_site_order;
      DROP TABLE IF EXISTS cms.news_articles;
    `);
    }
}
exports.CmsNews1738400000000 = CmsNews1738400000000;
//# sourceMappingURL=1738400000000-CmsNews.js.map