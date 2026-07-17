import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseCmsEntity } from '../../../common/entities/base-cms.entity';
import { Site } from '../../../core/site/entities/site.entity';
import { MediaAsset } from '../../../core/media/entities/media-asset.entity';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `TeacherProfile` — CMS-H.3. Third CMS-H content type, copying
 * `Testimonial`'s (CMS-H.2)/`GalleryItem`'s (CMS-H.1) shape onto the
 * `teacher_profiles` table (already created by H.1's shared migration):
 * extends `BaseCmsEntity`, its own `@ManyToOne(() => Site)` relation on
 * `site_id`.
 *
 * **Bounded-context note (architecture §1/§7):** this is a CMS-owned
 * *display* entity for the public "our teachers" marketing page — an
 * admin-entered name/role/bio/photo, nothing more. It is deliberately
 * unrelated to, and carries no FK reference to, the School-domain
 * `Teacher` entity (`modules/teacher`), which represents an actual
 * staff member with payroll/class-assignment/scheduling data. Nothing
 * in `modules/cms` may import from `modules/school`/`modules/teacher`,
 * and nothing here does — a school could publish a CMS `TeacherProfile`
 * for someone who isn't in the School domain at all (a guest instructor,
 * for instance), and the two are reconciled by an admin manually
 * re-entering the same name, not by a foreign key.
 *
 * `name` is a plain `varchar`, not localized (a proper noun, same
 * treatment `Testimonial.authorName` gets). `role` (e.g. "Grade 3
 * Homeroom Teacher") and `bio` *are* `LocalizedText`, since both read
 * naturally translated. `photoMediaId` follows the same nullable
 * bare-FK-to-`MediaAsset` convention as `Testimonial.avatarMediaId`.
 */
@Entity({ name: 'teacher_profiles', schema: 'cms' })
export class TeacherProfile extends BaseCmsEntity {
  @ManyToOne(() => Site)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  role: LocalizedText | null;

  @Column({ type: 'jsonb', nullable: true })
  bio: LocalizedText | null;

  @Column({ name: 'photo_media_id', nullable: true })
  photoMediaId: string | null;

  @ManyToOne(() => MediaAsset, { nullable: true })
  @JoinColumn({ name: 'photo_media_id' })
  photoMedia?: MediaAsset | null;
}
