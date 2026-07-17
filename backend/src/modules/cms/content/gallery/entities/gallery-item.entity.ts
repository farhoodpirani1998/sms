import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseCmsEntity } from '../../../common/entities/base-cms.entity';
import { Site } from '../../../core/site/entities/site.entity';
import { MediaAsset } from '../../../core/media/entities/media-asset.entity';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `GalleryItem` — CMS-H.1. First CMS-H content type, copying the same
 * `BaseCmsEntity` extension + `@ManyToOne(() => Site)` shape every prior
 * type uses, against the `gallery_items` table this sub-phase's
 * migration creates (alongside testimonials/teacher_profiles/campuses
 * for H.2–H.4).
 *
 * `media` is the one required (`nullable: false`) `MediaAsset` relation
 * in the whole module — every other content type's media reference
 * (`coverMediaId`/`ogImageMediaId`) is an optional illustrative extra: a
 * gallery item that references no image isn't a gallery item. `caption`
 * is `LocalizedText`, same per-locale jsonb convention as every other
 * translated field; `category` is a plain `varchar` (an arbitrary
 * admin-defined grouping label, e.g. "campus-life"/"sports" — not
 * translated, same non-localized-scalar treatment `Feature.icon`/
 * `Statistic.icon` get).
 */
@Entity({ name: 'gallery_items', schema: 'cms' })
export class GalleryItem extends BaseCmsEntity {
  @ManyToOne(() => Site)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'jsonb', nullable: true })
  caption: LocalizedText | null;

  @Column({ name: 'media_id' })
  mediaId: string;

  @ManyToOne(() => MediaAsset)
  @JoinColumn({ name: 'media_id' })
  media: MediaAsset;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;
}
