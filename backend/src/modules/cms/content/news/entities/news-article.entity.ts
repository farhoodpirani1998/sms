import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseCmsEntity } from '../../../common/entities/base-cms.entity';
import { Site } from '../../../core/site/entities/site.entity';
import { MediaAsset } from '../../../core/media/entities/media-asset.entity';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `NewsArticle` — CMS-G.1. Mirrors `Page` (CMS-F.1) field-for-field:
 * extends `BaseCmsEntity` the same way, its own `@ManyToOne(() => Site)`
 * relation on `site_id`, the same public-facing `slug` with
 * `UNIQUE (site_id, slug)` enforced at the DB level (`CmsNews`
 * migration, this sub-phase) and re-checked by `NewsService` before
 * insert/update, same as `PagesService`.
 *
 * `title`/`excerpt`/`body` are `LocalizedText`, same per-locale jsonb
 * convention as Pages and every other translated field. `metaTitle`/
 * `metaDescription` are the same embedded SEO fields Pages introduced —
 * `core/seo/`'s `ResolvedSeoMeta` (built out for Pages in CMS-F.2) reads
 * these the same way for News once CMS-G.2 wires up the public read.
 *
 * The one deliberate naming difference from `Page`: the image reference
 * is `coverMediaId` (not `ogImageMediaId`) — reusing the `coverMediaId`
 * convention `Hero`/`About`/`Feature` (CMS-D) already established,
 * per this sub-phase's roadmap dependency note ("reuses SeoMeta,
 * coverMediaId conventions"). It still doubles as the OG image source
 * once CMS-G.2 resolves `ResolvedSeoMeta.ogImageUrl` from it.
 */
@Entity({ name: 'news_articles', schema: 'cms' })
export class NewsArticle extends BaseCmsEntity {
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

  @Column({ name: 'cover_media_id', nullable: true })
  coverMediaId: string | null;

  @ManyToOne(() => MediaAsset, { nullable: true })
  @JoinColumn({ name: 'cover_media_id' })
  coverMedia?: MediaAsset | null;
}
