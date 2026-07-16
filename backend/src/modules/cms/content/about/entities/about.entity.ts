import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseCmsEntity } from '../../../common/entities/base-cms.entity';
import { Site } from '../../../core/site/entities/site.entity';
import { MediaAsset } from '../../../core/media/entities/media-asset.entity';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `About` — CMS-D.2. Second content type, copying `Hero`'s (CMS-D.1)
 * shape 1:1 against the `about_items` table `CmsSimpleContent`
 * (CMS-D.1's migration) already created: extends `BaseCmsEntity`, adds
 * its own `@ManyToOne(() => Site)` relation on `site_id`, and its own
 * fields as `jsonb`/scalar columns.
 *
 * Field list is simpler than Hero's — no CTA (About is descriptive
 * content, not a call-to-action banner) — just a required localized
 * `title` and an optional localized `body`, plus the same optional
 * `coverMediaId` → `MediaAsset` reference Hero uses for its background
 * image.
 */
@Entity({ name: 'about_items', schema: 'cms' })
export class About extends BaseCmsEntity {
  @ManyToOne(() => Site)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'jsonb' })
  title: LocalizedText;

  @Column({ type: 'jsonb', nullable: true })
  body: LocalizedText | null;

  @Column({ name: 'cover_media_id', nullable: true })
  coverMediaId: string | null;

  @ManyToOne(() => MediaAsset, { nullable: true })
  @JoinColumn({ name: 'cover_media_id' })
  coverMedia?: MediaAsset | null;
}
