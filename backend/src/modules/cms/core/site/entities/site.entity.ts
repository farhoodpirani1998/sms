import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * `Site` — the CMS module's own tenancy/scoping concept. See
 * docs/architecture/CMS_ARCHITECTURE.md §2.
 *
 * Deliberately has NO column, join, or import referencing `School`,
 * `schoolId`, or anything in `modules/school*` — that is the enforcement
 * point for the architecture's core guiding decision: CMS is a bounded
 * context separate from the School domain. `Site` is a content
 * partition, not an auth tenant — it carries no auth/user/role/billing
 * semantics; a user's permissions come entirely from the existing Auth
 * system regardless of which Site their action targets.
 *
 * Only one row exists today (NHG, seeded by the CmsSite migration), but
 * nothing here assumes a single Site — a second Site is a data insert,
 * not a schema or code change.
 */
export interface SeoMeta {
  title?: Record<string, string>;
  description?: Record<string, string>;
  ogImageId?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean;
}

@Entity({ name: 'sites', schema: 'cms' })
export class Site {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  // Used by the public API's Host-header resolver (CMS-I, later phase) to
  // find the Site for an incoming request. Unique + indexed so a second
  // Site only ever needs a new row here.
  @Column({ type: 'varchar', length: 255, unique: true })
  domain: string;

  @Column({ name: 'default_locale', type: 'varchar', length: 10, default: 'en' })
  defaultLocale: string;

  @Column({ name: 'supported_locales', type: 'jsonb', default: () => `'["en"]'` })
  supportedLocales: string[];

  // jsonb and nullable so Site-level config can grow without new
  // migrations (colors, logo, fonts, etc.).
  @Column({ type: 'jsonb', nullable: true })
  theme: Record<string, unknown> | null;

  @Column({ name: 'social_links', type: 'jsonb', nullable: true })
  socialLinks: Record<string, string> | null;

  @Column({ name: 'seo_defaults', type: 'jsonb', nullable: true })
  seoDefaults: SeoMeta | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
