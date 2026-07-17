import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseCmsEntity } from '../../../common/entities/base-cms.entity';
import { Site } from '../../../core/site/entities/site.entity';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `Campus` — CMS-H.4. Fourth and last CMS-H content type, copying
 * `TeacherProfile`'s (CMS-H.3)/`Testimonial`'s (CMS-H.2)/`GalleryItem`'s
 * (CMS-H.1) shape onto the `campuses` table (already created by H.1's
 * shared migration): extends `BaseCmsEntity`, its own
 * `@ManyToOne(() => Site)` relation on `site_id`.
 *
 * All three of this type's own columns are `jsonb` per H.1's migration
 * (`name`, `address`, `description` — no plain `varchar`/scalar field
 * and no `MediaAsset` reference at all, unlike every other CMS-H type).
 * Per that migration's doc comment, a single photo reference "didn't
 * seem load-bearing for a campus listing" in this sub-phase; that can
 * be revisited with an `ALTER TABLE` later without disturbing this
 * shape. Following the same convention every other jsonb text column in
 * this module uses (`Testimonial.quote`/`authorRole`, `TeacherProfile.
 * role`/`bio`), all three are typed `LocalizedText` rather than a plain
 * string or a bespoke structured-address type: unlike `TeacherProfile.
 * name` or `Testimonial.authorName`, a campus name and its address are
 * both content an admin would reasonably want to present in whichever
 * locale a visitor is reading in (e.g. a transliterated or fully
 * translated street/area name), not a proper noun fixed to one script.
 * `name` is required (`NOT NULL` in the migration, same as `Testimonial.
 * quote`); `address`/`description` are optional, same nullable
 * `LocalizedText` treatment `TeacherProfile.role`/`bio` get.
 */
@Entity({ name: 'campuses', schema: 'cms' })
export class Campus extends BaseCmsEntity {
  @ManyToOne(() => Site)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'jsonb' })
  name: LocalizedText;

  @Column({ type: 'jsonb', nullable: true })
  address: LocalizedText | null;

  @Column({ type: 'jsonb', nullable: true })
  description: LocalizedText | null;
}
