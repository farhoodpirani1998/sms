import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SiteSettings } from './entities/site-settings.entity';
import { BaseContentService } from '../../common/services/base-content.service';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { RevisionsService } from '../../core/revisions/revisions.service';
import { PublishingService } from '../../core/publishing/publishing.service';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';

/** Public-facing shape — localized fields resolved to plain strings. */
export interface PublicSiteSettings {
  footerText: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  copyrightText: string | null;
  maintenanceMode: boolean;
  analyticsId: string | null;
}

/**
 * `SiteSettingsService` — CMS-E.1. Extends `BaseContentService` like
 * every CMS-D service, but is the first singleton: no `create()` call
 * is ever client-driven, and there's no `reorder()` at all (a lone row
 * has nothing to reorder against, unlike Statistic/Feature/Faq). Every
 * public method takes `siteId` alone — never an `id` — since the id of
 * the one row per Site is an implementation detail `getOrCreate()`
 * resolves internally, not something a client should need to track.
 *
 * `getOrCreate()` is the one new primitive this class adds over the
 * CMS-D shape: look up the existing row by `siteId` (not `id` — there's
 * no `findOne(siteId, id)` call anywhere in this class), and only call
 * the inherited `create()` if none exists. The migration's `UNIQUE`
 * constraint on `site_id` is the backstop if two concurrent requests
 * both miss the lookup and race to create — the loser's insert fails at
 * the DB, not silently duplicating a row; that race is narrow enough
 * (first-ever request for a Site) that surfacing it as a 500 rather
 * than handling it with a retry/upsert is an acceptable tradeoff for
 * this sub-phase.
 */
@Injectable()
export class SiteSettingsService extends BaseContentService<SiteSettings> implements OnModuleInit {
  constructor(
    @InjectRepository(SiteSettings)
    repository: Repository<SiteSettings>,
    revisionsService: RevisionsService,
    events: EventEmitter2,
    private readonly publishingService: PublishingService,
    private readonly localeResolverService: LocaleResolverService,
  ) {
    super(repository, CmsEntityType.SITE_SETTINGS, revisionsService, events);
  }

  onModuleInit(): void {
    this.publishingService.registerSchedulable({
      entityType: this.entityType,
      repository: this.repository,
      contentService: this,
    });
  }

  /**
   * Returns the singleton row for `siteId`, creating it with all-null/
   * default fields on first access. This is the only lookup path this
   * class uses internally — every other method below calls this first
   * to resolve the row's `id`, rather than taking one from the caller.
   * Every call site here has a real acting user (`CurrentUser` on the
   * controller), so unlike `applyStatusTransition()`'s cron-facing
   * nullable `userId`, this one is always a real string — no
   * unauthenticated path ever reaches this method.
   */
  async getOrCreate(siteId: string, userId: string): Promise<SiteSettings> {
    const existing = await this.repository.findOne({ where: { siteId } });
    if (existing) {
      return existing;
    }

    return this.create(siteId, {} as DeepPartial<SiteSettings>, userId);
  }

  async updateSettings(
    siteId: string,
    dto: UpdateSiteSettingsDto,
    userId: string,
  ): Promise<SiteSettings> {
    const existing = await this.getOrCreate(siteId, userId);
    return this.update(siteId, existing.id, dto as DeepPartial<SiteSettings>, userId);
  }

  async publish(siteId: string, userId: string): Promise<SiteSettings> {
    const existing = await this.getOrCreate(siteId, userId);
    return this.publishingService.publish(this, this.entityType, siteId, existing.id, userId);
  }

  async unpublish(siteId: string, userId: string): Promise<SiteSettings> {
    const existing = await this.getOrCreate(siteId, userId);
    return this.publishingService.unpublish(this, this.entityType, siteId, existing.id, userId);
  }

  async schedule(siteId: string, scheduledAt: Date, userId: string): Promise<SiteSettings> {
    const existing = await this.getOrCreate(siteId, userId);
    return this.publishingService.schedule(
      this,
      this.entityType,
      siteId,
      existing.id,
      scheduledAt,
      userId,
    );
  }

  async restore(siteId: string, revisionId: string, userId: string): Promise<SiteSettings> {
    const existing = await this.getOrCreate(siteId, userId);
    const revision = await this.revisionsService.restore(
      this.entityType,
      existing.id,
      revisionId,
      userId,
    );

    // Same "never trust a bare id" re-check every other content service
    // performs — `RevisionsService.restore()` doesn't scope by siteId.
    if (revision.siteId !== siteId) {
      throw new NotFoundException('Revision not found');
    }

    const snapshot = revision.snapshot as Partial<SiteSettings>;
    return this.update(
      siteId,
      existing.id,
      {
        footerText: snapshot.footerText ?? null,
        contactEmail: snapshot.contactEmail ?? null,
        contactPhone: snapshot.contactPhone ?? null,
        contactAddress: snapshot.contactAddress ?? null,
        copyrightText: snapshot.copyrightText ?? null,
        maintenanceMode: snapshot.maintenanceMode ?? false,
        analyticsId: snapshot.analyticsId ?? null,
      } as DeepPartial<SiteSettings>,
      userId,
    );
  }

  /**
   * `GET /cms/public/site-settings` — the singleton row's localized
   * fields, only if `PUBLISHED`. Returns `null` rather than a 404 when
   * nothing's been published yet — a settings block with no published
   * content is a normal, expected state for a brand-new Site, not an
   * error condition the way a missing Hero/About row would be.
   */
  async findPublished(
    siteId: string,
    requestedLocale?: string,
  ): Promise<PublicSiteSettings | null> {
    const row = await this.repository.findOne({
      where: { siteId, status: ContentStatus.PUBLISHED } as any,
    });

    if (!row) {
      return null;
    }

    const locale = await this.localeResolverService.resolve(siteId, requestedLocale);
    const defaultLocale = await this.localeResolverService.resolve(siteId);

    return {
      footerText: this.localeResolverService.resolveText(row.footerText, locale, defaultLocale),
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      contactAddress: this.localeResolverService.resolveText(
        row.contactAddress,
        locale,
        defaultLocale,
      ),
      copyrightText: this.localeResolverService.resolveText(
        row.copyrightText,
        locale,
        defaultLocale,
      ),
      maintenanceMode: row.maintenanceMode,
      analyticsId: row.analyticsId,
    };
  }
}
