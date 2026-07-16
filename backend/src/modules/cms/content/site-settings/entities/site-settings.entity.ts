import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseCmsEntity } from '../../../common/entities/base-cms.entity';
import { Site } from '../../../core/site/entities/site.entity';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `SiteSettings` — CMS-E.1. First CMS-E content type, and the first
 * singleton — extends `BaseCmsEntity` the same way every CMS-D type
 * does (site relation, sort_order, status/publish columns), but the
 * `site_id` column carries a UNIQUE constraint at the DB level (this
 * sub-phase's migration) rather than the plain index CMS-D tables use,
 * since exactly one row may exist per Site. `SiteSettingsService`'s
 * get-or-create logic is the application-level half of that guarantee;
 * the DB constraint is the backstop against a race creating two.
 *
 * Fields cover site-wide *content* an editor drafts/publishes/revises —
 * footer text, contact details, copyright, a maintenance banner, an
 * analytics id — deliberately not repeating anything `Site` (CMS-A.2)
 * already owns (name/domain/locales/theme/socialLinks/seoDefaults),
 * which is core tenancy/branding config with no publish workflow.
 */
@Entity({ name: 'site_settings', schema: 'cms' })
export class SiteSettings extends BaseCmsEntity {
  @ManyToOne(() => Site)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ name: 'footer_text', type: 'jsonb', nullable: true })
  footerText: LocalizedText | null;

  @Column({ name: 'contact_email', type: 'varchar', length: 255, nullable: true })
  contactEmail: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', length: 50, nullable: true })
  contactPhone: string | null;

  @Column({ name: 'contact_address', type: 'jsonb', nullable: true })
  contactAddress: LocalizedText | null;

  @Column({ name: 'copyright_text', type: 'jsonb', nullable: true })
  copyrightText: LocalizedText | null;

  @Column({ name: 'maintenance_mode', type: 'boolean', default: false })
  maintenanceMode: boolean;

  @Column({ name: 'analytics_id', type: 'varchar', length: 100, nullable: true })
  analyticsId: string | null;
}
