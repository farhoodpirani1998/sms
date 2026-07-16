import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseCmsEntity } from '../../../common/entities/base-cms.entity';
import { Site } from '../../../core/site/entities/site.entity';
import { MediaAsset } from '../../../core/media/entities/media-asset.entity';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `Hero` — CMS-D.1. The reference implementation every other CMS-D
 * (About/CTA/Statistics/Features/FAQ) and later content type copies —
 * same extension shape `ProofBlock` (CMS-C.5) proved: extends
 * `BaseCmsEntity` for id/siteId/sortOrder/status/publishedAt/
 * scheduledAt/audit columns, adds its own `@ManyToOne(() => Site)`
 * relation on `site_id` (the base class only declares the bare column —
 * see that class's doc comment), and its own fields as `jsonb`/scalar
 * columns against the table `CmsSimpleContent` (this sub-phase's
 * migration) already created.
 *
 * A Site's homepage typically has one active Hero, but nothing here
 * enforces that at the DB level — `sortOrder`/`status` (inherited) let
 * an admin stage a replacement Hero as a draft and publish it when
 * ready, or, for a Site that wants a rotating banner, publish more than
 * one. `HeroPublicController` (this sub-phase) returns every published
 * row ordered by `sortOrder`, leaving "how many to actually render" a
 * frontend concern.
 *
 * `coverMediaId` is a bare column, not a relation, matching
 * `NewsArticle`'s `coverMediaId` convention referenced in the roadmap
 * (CMS-G.1) and `UpsertHeroDto`'s doc comment: the id is validated
 * against `MediaAsset` in the service layer, not enforced as a TypeORM
 * relation, since a Hero with no cover image is the common case (the
 * column is nullable) and NestJS doesn't need eager-loaded joins for a
 * simple id reference the frontend will resolve to a URL itself.
 */
@Entity({ name: 'hero_items', schema: 'cms' })
export class Hero extends BaseCmsEntity {
  @ManyToOne(() => Site)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'jsonb' })
  title: LocalizedText;

  @Column({ type: 'jsonb', nullable: true })
  subtitle: LocalizedText | null;

  @Column({ name: 'cta_label', type: 'jsonb', nullable: true })
  ctaLabel: LocalizedText | null;

  @Column({ name: 'cta_url', type: 'varchar', length: 2000, nullable: true })
  ctaUrl: string | null;

  @Column({ name: 'cover_media_id', nullable: true })
  coverMediaId: string | null;

  @ManyToOne(() => MediaAsset, { nullable: true })
  @JoinColumn({ name: 'cover_media_id' })
  coverMedia?: MediaAsset | null;
}
