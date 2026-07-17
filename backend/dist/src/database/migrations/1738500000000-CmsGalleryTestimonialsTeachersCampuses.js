"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmsGalleryTestimonialsTeachersCampuses1738500000000 = void 0;
class CmsGalleryTestimonialsTeachersCampuses1738500000000 {
    constructor() {
        this.name = 'CmsGalleryTestimonialsTeachersCampuses1738500000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE cms.gallery_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms.sites(id),
        sort_order INT NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'in_review', 'scheduled', 'published', 'archived')),
        published_at TIMESTAMPTZ,
        scheduled_at TIMESTAMPTZ,
        caption JSONB,
        media_id UUID NOT NULL REFERENCES cms.media_assets(id),
        category VARCHAR(100),
        created_by_id UUID,
        updated_by_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_cms_gallery_items_site_order
        ON cms.gallery_items(site_id, sort_order);

      CREATE INDEX idx_cms_gallery_items_scheduled
        ON cms.gallery_items(status, scheduled_at)
        WHERE status = 'scheduled';

      CREATE TABLE cms.testimonials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms.sites(id),
        sort_order INT NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'in_review', 'scheduled', 'published', 'archived')),
        published_at TIMESTAMPTZ,
        scheduled_at TIMESTAMPTZ,
        quote JSONB NOT NULL,
        author_name VARCHAR(255) NOT NULL,
        author_role JSONB,
        avatar_media_id UUID REFERENCES cms.media_assets(id),
        rating SMALLINT,
        created_by_id UUID,
        updated_by_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT chk_cms_testimonials_rating CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5))
      );

      CREATE INDEX idx_cms_testimonials_site_order
        ON cms.testimonials(site_id, sort_order);

      CREATE INDEX idx_cms_testimonials_scheduled
        ON cms.testimonials(status, scheduled_at)
        WHERE status = 'scheduled';

      CREATE TABLE cms.teacher_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms.sites(id),
        sort_order INT NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'in_review', 'scheduled', 'published', 'archived')),
        published_at TIMESTAMPTZ,
        scheduled_at TIMESTAMPTZ,
        name VARCHAR(255) NOT NULL,
        role JSONB,
        bio JSONB,
        photo_media_id UUID REFERENCES cms.media_assets(id),
        created_by_id UUID,
        updated_by_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_cms_teacher_profiles_site_order
        ON cms.teacher_profiles(site_id, sort_order);

      CREATE INDEX idx_cms_teacher_profiles_scheduled
        ON cms.teacher_profiles(status, scheduled_at)
        WHERE status = 'scheduled';

      CREATE TABLE cms.campuses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms.sites(id),
        sort_order INT NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'in_review', 'scheduled', 'published', 'archived')),
        published_at TIMESTAMPTZ,
        scheduled_at TIMESTAMPTZ,
        name JSONB NOT NULL,
        address JSONB,
        description JSONB,
        created_by_id UUID,
        updated_by_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_cms_campuses_site_order
        ON cms.campuses(site_id, sort_order);

      CREATE INDEX idx_cms_campuses_scheduled
        ON cms.campuses(status, scheduled_at)
        WHERE status = 'scheduled';
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      DROP INDEX IF EXISTS cms.idx_cms_campuses_scheduled;
      DROP INDEX IF EXISTS cms.idx_cms_campuses_site_order;
      DROP TABLE IF EXISTS cms.campuses;

      DROP INDEX IF EXISTS cms.idx_cms_teacher_profiles_scheduled;
      DROP INDEX IF EXISTS cms.idx_cms_teacher_profiles_site_order;
      DROP TABLE IF EXISTS cms.teacher_profiles;

      DROP INDEX IF EXISTS cms.idx_cms_testimonials_scheduled;
      DROP INDEX IF EXISTS cms.idx_cms_testimonials_site_order;
      DROP TABLE IF EXISTS cms.testimonials;

      DROP INDEX IF EXISTS cms.idx_cms_gallery_items_scheduled;
      DROP INDEX IF EXISTS cms.idx_cms_gallery_items_site_order;
      DROP TABLE IF EXISTS cms.gallery_items;
    `);
    }
}
exports.CmsGalleryTestimonialsTeachersCampuses1738500000000 = CmsGalleryTestimonialsTeachersCampuses1738500000000;
//# sourceMappingURL=1738500000000-CmsGalleryTestimonialsTeachersCampuses.js.map