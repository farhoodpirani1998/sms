import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseCmsEntity } from '../../../common/entities/base-cms.entity';
import { Site } from '../../../core/site/entities/site.entity';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `NavigationItem` — CMS-E.2. Second table `CmsSiteSettingsNavigation`
 * (CMS-E.1's migration) already created, extending `BaseCmsEntity` the
 * same way every other content type does, plus the one thing that makes
 * this type different from every CMS-D/`SiteSettings` type so far: a
 * self-referencing `parentId` (nullable FK to this same table,
 * `ON DELETE CASCADE` — see the migration's doc comment) that
 * `NavigationService` walks to assemble a menu tree.
 *
 * `label` is `LocalizedText` (same convention as `Statistic.label`, the
 * one other CMS-D/E field that's translated but has no rich-text body).
 * `url` is a plain nullable string — a menu item may be a bare label
 * grouping children (no link of its own) rather than always pointing
 * somewhere, e.g. a "Programs" parent whose children are the actual
 * pages.
 *
 * `sortOrder` (inherited from `BaseCmsEntity`) is scoped *per parent*
 * here, unlike every CMS-D list type where it's scoped per Site —
 * `OrderingService.reorder()` itself doesn't know about `parentId`, so
 * `NavigationService.reorder()` is responsible for only ever passing it
 * the sibling set that shares one `parentId` (see that method's doc
 * comment) rather than the whole Site's rows at once.
 */
@Entity({ name: 'navigation_items', schema: 'cms' })
export class NavigationItem extends BaseCmsEntity {
  @ManyToOne(() => Site)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => NavigationItem, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: NavigationItem | null;

  @Column({ type: 'jsonb' })
  label: LocalizedText;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  url: string | null;
}
