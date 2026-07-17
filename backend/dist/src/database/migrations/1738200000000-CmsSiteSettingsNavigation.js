"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmsSiteSettingsNavigation1738200000000 = void 0;
class CmsSiteSettingsNavigation1738200000000 {
    constructor() {
        this.name = 'CmsSiteSettingsNavigation1738200000000';
    }
    async up(queryRunner) {
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
    async down(queryRunner) {
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
exports.CmsSiteSettingsNavigation1738200000000 = CmsSiteSettingsNavigation1738200000000;
//# sourceMappingURL=1738200000000-CmsSiteSettingsNavigation.js.map