"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmsRevisions1737900000000 = void 0;
class CmsRevisions1737900000000 {
    constructor() {
        this.name = 'CmsRevisions1737900000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE cms.content_revisions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms.sites(id),
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        snapshot JSONB NOT NULL,
        created_by_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_cms_content_revisions_entity
        ON cms.content_revisions(entity_type, entity_id, created_at DESC);
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      DROP INDEX IF EXISTS cms.idx_cms_content_revisions_entity;
      DROP TABLE IF EXISTS cms.content_revisions;
    `);
    }
}
exports.CmsRevisions1737900000000 = CmsRevisions1737900000000;
//# sourceMappingURL=1737900000000-CmsRevisions.js.map