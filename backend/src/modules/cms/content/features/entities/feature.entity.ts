import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseCmsEntity } from '../../../common/entities/base-cms.entity';
import { Site } from '../../../core/site/entities/site.entity';
import { MediaAsset } from '../../../core/media/entities/media-asset.entity';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `Feature` — CMS-D.5. Fifth content type, copying `Hero`'s (CMS-D.1)/
 * `About`'s (CMS-D.2)/`Cta`'s (CMS-D.3)/`Statistic`'s (CMS-D.4) shape 1:1
 * against the `features` table `CmsSimpleContent` (CMS-D.1's migration)
 * already created: extends `BaseCmsEntity`, adds its own
 * `@ManyToOne(() => Site)` relation on `site_id`, and its own fields as
 * `jsonb`/scalar columns.
 *
 * `coverMediaId` → `MediaAsset` is back here (per the migration's doc
 * comment, hero/about/features are the three types that plausibly show
 * an illustrative image) — same nullable bare-column + service-layer
 * validation split Hero/About already use, not a required relation.
 *
 * `icon` is a plain `varchar`, same as `Statistic.icon` — an icon name
 * isn't translated per locale, only `title`/`description` are.
 */
@Entity({ name: 'features', schema: 'cms' })
export class Feature extends BaseCmsEntity {
  @ManyToOne(() => Site)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'jsonb' })
  title: LocalizedText;

  @Column({ type: 'jsonb', nullable: true })
  description: LocalizedText | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string | null;

  @Column({ name: 'cover_media_id', nullable: true })
  coverMediaId: string | null;

  @ManyToOne(() => MediaAsset, { nullable: true })
  @JoinColumn({ name: 'cover_media_id' })
  coverMedia?: MediaAsset | null;
}
