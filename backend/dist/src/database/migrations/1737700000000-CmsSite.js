"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmsSite1737700000000 = void 0;
class CmsSite1737700000000 {
    constructor() {
        this.name = 'CmsSite1737700000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE cms.sites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        domain VARCHAR(255) NOT NULL UNIQUE,
        default_locale VARCHAR(10) NOT NULL DEFAULT 'en',
        supported_locales JSONB NOT NULL DEFAULT '["en"]',
        theme JSONB,
        social_links JSONB,
        seo_defaults JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
        await queryRunner.query(`
      INSERT INTO cms.sites (name, domain, default_locale, supported_locales)
      VALUES ('NHG', 'nhg.example.com', 'en', '["en", "fa"]');
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS cms.sites`);
    }
}
exports.CmsSite1737700000000 = CmsSite1737700000000;
//# sourceMappingURL=1737700000000-CmsSite.js.map