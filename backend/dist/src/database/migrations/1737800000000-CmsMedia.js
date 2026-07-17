"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmsMedia1737800000000 = void 0;
class CmsMedia1737800000000 {
    constructor() {
        this.name = 'CmsMedia1737800000000';
    }
    async up(queryRunner) {
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
    async down(queryRunner) {
        await queryRunner.query(`
      DROP INDEX IF EXISTS cms.idx_cms_media_assets_site;
      DROP TABLE IF EXISTS cms.media_assets;
    `);
    }
}
exports.CmsMedia1737800000000 = CmsMedia1737800000000;
//# sourceMappingURL=1737800000000-CmsMedia.js.map