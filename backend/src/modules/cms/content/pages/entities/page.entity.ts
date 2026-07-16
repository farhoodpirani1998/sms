import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseCmsEntity } from '../../../common/entities/base-cms.entity';
import { Site } from '../../../core/site/entities/site.entity';
import { MediaAsset } from '../../../core/media/entities/media-asset.entity';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `Page` — CMS-F.1. First content type outside CMS-D/E's fixed six +
 * singleton + tree shapes: a generic, slug-addressed content page
 * (`/about-us`, `/admissions`, ...) an editor can create any number of,
 * extending `BaseCmsEntity` the same way every prior type does, plus
 * its own `@ManyToOne(() => Site)` relation on `site_id` (`CmsPages`
 * migration, this sub-phase).
 *
 * `slug` is the one field with no equivalent on any CMS-D/E type —
 * `UNIQUE (site_id, slug)` at the DB level (this sub-phase's migration)
 * is the source of truth; `PagesService` re-checks it before insert/
 * update so a duplicate slug fails with a clear `ConflictException`
 * rather than a raw Postgres constraint error.
 *
 * `title`/`excerpt`/`body` are `LocalizedText`, following the same
 * per-locale jsonb convention as every other translated field in the
 * module. `metaTitle`/`metaDescription`/`ogMediaId` are embedded SEO
 * fields (see the migration's doc comment) — CMS-F.2 adds the shared
 * `core/seo/` module that reads them for sitemap/robots generation, but
 * the columns themselves live here since a Page owns its own SEO
 * metadata, same as Hero/About/Features own their own `coverMediaId`.
 */
@Entity({ name: 'pages', schema: 'cms' })
export class Page extends BaseCmsEntity {
  @ManyToOne(() => Site)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @Column({ type: 'jsonb' })
  title: LocalizedText;

  @Column({ type: 'jsonb', nullable: true })
  excerpt: LocalizedText | null;

  @Column({ type: 'jsonb', nullable: true })
  body: LocalizedText | null;

  @Column({ name: 'meta_title', type: 'jsonb', nullable: true })
  metaTitle: LocalizedText | null;

  @Column({ name: 'meta_description', type: 'jsonb', nullable: true })
  metaDescription: LocalizedText | null;

  @Column({ name: 'og_image_media_id', nullable: true })
  ogImageMediaId: string | null;

  @ManyToOne(() => MediaAsset, { nullable: true })
  @JoinColumn({ name: 'og_image_media_id' })
  ogImageMedia?: MediaAsset | null;
}
