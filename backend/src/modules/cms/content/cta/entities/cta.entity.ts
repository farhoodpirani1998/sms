import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseCmsEntity } from '../../../common/entities/base-cms.entity';
import { Site } from '../../../core/site/entities/site.entity';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `Cta` — CMS-D.3. Third content type, copying `Hero`'s (CMS-D.1)/
 * `About`'s (CMS-D.2) shape 1:1 against the `cta_items` table
 * `CmsSimpleContent` (CMS-D.1's migration) already created: extends
 * `BaseCmsEntity`, adds its own `@ManyToOne(() => Site)` relation on
 * `site_id`, and its own fields as `jsonb`/scalar columns.
 *
 * No `coverMediaId` here — per the migration's doc comment, only
 * hero/about/features reference `MediaAsset`; a CTA banner is text +
 * button, not an illustrated block, so this entity has no `MediaAsset`
 * import at all (unlike Hero/About).
 */
@Entity({ name: 'cta_items', schema: 'cms' })
export class Cta extends BaseCmsEntity {
  @ManyToOne(() => Site)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'jsonb' })
  title: LocalizedText;

  @Column({ type: 'jsonb', nullable: true })
  body: LocalizedText | null;

  @Column({ name: 'button_label', type: 'jsonb', nullable: true })
  buttonLabel: LocalizedText | null;

  @Column({ name: 'button_url', type: 'varchar', length: 2000, nullable: true })
  buttonUrl: string | null;
}
