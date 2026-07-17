import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseCmsEntity } from '../../../common/entities/base-cms.entity';
import { Site } from '../../../core/site/entities/site.entity';
import { MediaAsset } from '../../../core/media/entities/media-asset.entity';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `Testimonial` — CMS-H.2. Second CMS-H content type, copying
 * `GalleryItem`'s (CMS-H.1) shape onto the `testimonials` table
 * (already created by H.1's shared migration): extends `BaseCmsEntity`,
 * its own `@ManyToOne(() => Site)` relation on `site_id`.
 *
 * `quote` is `LocalizedText`, same per-locale jsonb convention as every
 * other translated field. `authorName` is a plain `varchar`, not
 * localized — same "proper noun, not translated" treatment the
 * architecture gives names elsewhere (e.g. `TeacherProfile.name`,
 * CMS-H.3). `authorRole` (e.g. "Parent of a 3rd grader") *is*
 * `LocalizedText` since a role/relationship description reads
 * naturally in any locale, unlike a name. `avatarMediaId` follows the
 * same nullable bare-FK-to-`MediaAsset` convention as `Feature.
 * coverMediaId` — optional, not the required-media exception
 * `GalleryItem.mediaId` is. `rating` is an optional 1–5 star score,
 * DB-enforced via the migration's `CHECK` constraint rather than
 * re-validated here (same split every other DB-level constraint in
 * this module uses).
 */
@Entity({ name: 'testimonials', schema: 'cms' })
export class Testimonial extends BaseCmsEntity {
  @ManyToOne(() => Site)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'jsonb' })
  quote: LocalizedText;

  @Column({ name: 'author_name', type: 'varchar', length: 255 })
  authorName: string;

  @Column({ name: 'author_role', type: 'jsonb', nullable: true })
  authorRole: LocalizedText | null;

  @Column({ name: 'avatar_media_id', nullable: true })
  avatarMediaId: string | null;

  @ManyToOne(() => MediaAsset, { nullable: true })
  @JoinColumn({ name: 'avatar_media_id' })
  avatarMedia?: MediaAsset | null;

  @Column({ type: 'smallint', nullable: true })
  rating: number | null;
}
