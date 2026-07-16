import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseCmsEntity } from '../../../common/entities/base-cms.entity';
import { Site } from '../../../core/site/entities/site.entity';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `Faq` — CMS-D.6. Sixth and last CMS-D content type, copying `Hero`'s
 * (CMS-D.1)/`About`'s (CMS-D.2)/`Cta`'s (CMS-D.3)/`Statistic`'s
 * (CMS-D.4)/`Feature`'s (CMS-D.5) shape 1:1 against the `faqs` table
 * `CmsSimpleContent` (CMS-D.1's migration) already created: extends
 * `BaseCmsEntity`, adds its own `@ManyToOne(() => Site)` relation on
 * `site_id`, and its own fields as `jsonb` columns.
 *
 * Simplest field list of the six — no `coverMediaId` (like Cta/
 * Statistic, an FAQ entry has no illustrative image) and no plain-scalar
 * field either (unlike Statistic's `value`/`icon` or Feature's `icon`):
 * both `question` and `answer` are required localized text, nothing
 * else.
 */
@Entity({ name: 'faqs', schema: 'cms' })
export class Faq extends BaseCmsEntity {
  @ManyToOne(() => Site)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'jsonb' })
  question: LocalizedText;

  @Column({ type: 'jsonb' })
  answer: LocalizedText;
}
