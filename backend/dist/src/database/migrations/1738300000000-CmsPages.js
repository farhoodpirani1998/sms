"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmsPages1738300000000 = void 0;
class CmsPages1738300000000 {
    constructor() {
        this.name = 'CmsPages1738300000000';
    }
    async up(queryRunner) {
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
    async down(queryRunner) {
        await queryRunner.query(`
      DROP INDEX IF EXISTS cms.idx_cms_pages_scheduled;
      DROP INDEX IF EXISTS cms.idx_cms_pages_site_order;
      DROP TABLE IF EXISTS cms.pages;
    `);
    }
}
exports.CmsPages1738300000000 = CmsPages1738300000000;
//# sourceMappingURL=1738300000000-CmsPages.js.map