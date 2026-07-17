"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropCmsProofBlock1738600000000 = void 0;
class DropCmsProofBlock1738600000000 {
    constructor() {
        this.name = 'DropCmsProofBlock1738600000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      DROP INDEX IF EXISTS cms.idx_cms_proof_blocks_scheduled;
      DROP INDEX IF EXISTS cms.idx_cms_proof_blocks_site_order;
      DROP TABLE IF EXISTS cms.proof_blocks;
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE cms.proof_blocks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms.sites(id),
        sort_order INT NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'in_review', 'scheduled', 'published', 'archived')),
        published_at TIMESTAMPTZ,
        scheduled_at TIMESTAMPTZ,
        title JSONB NOT NULL,
        body JSONB,
        created_by_id UUID,
        updated_by_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_cms_proof_blocks_site_order
        ON cms.proof_blocks(site_id, sort_order);

      CREATE INDEX idx_cms_proof_blocks_scheduled
        ON cms.proof_blocks(status, scheduled_at)
        WHERE status = 'scheduled';
    `);
    }
}
exports.DropCmsProofBlock1738600000000 = DropCmsProofBlock1738600000000;
//# sourceMappingURL=1738600000000-DropCmsProofBlock.js.map