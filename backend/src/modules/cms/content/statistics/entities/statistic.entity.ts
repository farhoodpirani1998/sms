import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseCmsEntity } from '../../../common/entities/base-cms.entity';
import { Site } from '../../../core/site/entities/site.entity';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `Statistic` — CMS-D.4. Fourth content type, copying `Hero`'s
 * (CMS-D.1)/`About`'s (CMS-D.2)/`Cta`'s (CMS-D.3) shape 1:1 against the
 * `statistics` table `CmsSimpleContent` (CMS-D.1's migration) already
 * created: extends `BaseCmsEntity`, adds its own `@ManyToOne(() => Site)`
 * relation on `site_id`, and its own fields as `jsonb`/scalar columns.
 *
 * No `coverMediaId` — same as `Cta`, a stat block ("500+ Graduates") is
 * text + optional icon name, not an illustrated block.
 *
 * `value` is a plain `varchar`, not `jsonb` — unlike `label` (the only
 * localized field here), the number/string a stat displays ("500+",
 * "98%") isn't translated per locale in this schema; only its label is.
 *
 * Per the roadmap's D.4 note, this is the first real (non-proof) content
 * type where `OrderingService.reorder()` matters operationally — a
 * Site's stats row (e.g. "Students / Teachers / Years / Campuses") is
 * inherently ordered, unlike Hero/About's typically-single-row case.
 */
@Entity({ name: 'statistics', schema: 'cms' })
export class Statistic extends BaseCmsEntity {
  @ManyToOne(() => Site)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'jsonb' })
  label: LocalizedText;

  @Column({ type: 'varchar', length: 50 })
  value: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string | null;
}
