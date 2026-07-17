import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CMS-H.1 — Migration (all 4 tables) + Gallery.
 *
 * Creates the four `cms.*` tables backing the last content group (§8
 * CMS-H of the architecture doc's suggested phasing): gallery_items,
 * testimonials, teacher_profiles, campuses. Per the roadmap, all four
 * share one migration file created once here, same pattern
 * `CmsSimpleContent` (CMS-D.1) established for its six tables — H.2–H.4
 * build entity/service/controller code against the three tables already
 * created here, they do not add their own.
 *
 * Every table follows the same `BaseCmsEntity` column shape every prior
 * CMS table uses: id, site_id (FK -> cms.sites), sort_order, status
 * (VARCHAR(20) + CHECK), published_at, scheduled_at, created_by_id,
 * updated_by_id, created_at, updated_at — plus each table's own fields.
 * Same two indexes per table (site_id+sort_order for ordered listing, a
 * partial status+scheduled_at index for the scheduled-publish cron).
 *
 * Only `gallery_items` gets an entity/service/controller in this
 * sub-phase (see `content/gallery/`) — the other three tables sit
 * unused until H.2–H.4 land, same as five of `CmsSimpleContent`'s six
 * tables did between CMS-D.1 and D.6.
 *
 * Media references: `gallery_items.media_id` is the one NOT NULL
 * `MediaAsset` FK in the whole module — a gallery item that references
 * no image isn't a gallery item, unlike every other type's optional
 * illustrative `cover_media_id`/`coverMediaId`. `testimonials.
 * avatar_media_id` and `teacher_profiles.photo_media_id` stay nullable
 * (a testimonial/teacher entry is still meaningful without a photo).
 * `campuses` has no media column in this sub-phase's schema — a single
 * photo reference didn't seem load-bearing for a campus listing; H.4
 * can extend this table with `ALTER TABLE` if that turns out wrong,
 * same latitude every other sub-phase has to revise an earlier
 * assumption.
 */
export class CmsGalleryTestimonialsTeachersCampuses1738500000000
  implements MigrationInterface
{
  name = 'CmsGalleryTestimonialsTeachersCampuses1738500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
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
