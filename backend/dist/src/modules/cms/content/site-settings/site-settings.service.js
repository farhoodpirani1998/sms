"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiteSettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const site_settings_entity_1 = require("./entities/site-settings.entity");
const base_content_service_1 = require("../../common/services/base-content.service");
const locale_resolver_service_1 = require("../../common/services/locale-resolver.service");
const cms_entity_type_enum_1 = require("../../common/enums/cms-entity-type.enum");
const content_status_enum_1 = require("../../common/enums/content-status.enum");
const revisions_service_1 = require("../../core/revisions/revisions.service");
const publishing_service_1 = require("../../core/publishing/publishing.service");
let SiteSettingsService = class SiteSettingsService extends base_content_service_1.BaseContentService {
    constructor(repository, revisionsService, events, publishingService, localeResolverService) {
        super(repository, cms_entity_type_enum_1.CmsEntityType.SITE_SETTINGS, revisionsService, events);
        this.publishingService = publishingService;
        this.localeResolverService = localeResolverService;
    }
    onModuleInit() {
        this.publishingService.registerSchedulable({
            entityType: this.entityType,
            repository: this.repository,
            contentService: this,
        });
    }
    async getOrCreate(siteId, userId) {
        const existing = await this.repository.findOne({ where: { siteId } });
        if (existing) {
            return existing;
        }
        return this.create(siteId, {}, userId);
    }
    async updateSettings(siteId, dto, userId) {
        const existing = await this.getOrCreate(siteId, userId);
        return this.update(siteId, existing.id, dto, userId);
    }
    async publish(siteId, userId) {
        const existing = await this.getOrCreate(siteId, userId);
        return this.publishingService.publish(this, this.entityType, siteId, existing.id, userId);
    }
    async unpublish(siteId, userId) {
        const existing = await this.getOrCreate(siteId, userId);
        return this.publishingService.unpublish(this, this.entityType, siteId, existing.id, userId);
    }
    async schedule(siteId, scheduledAt, userId) {
        const existing = await this.getOrCreate(siteId, userId);
        return this.publishingService.schedule(this, this.entityType, siteId, existing.id, scheduledAt, userId);
    }
    async restore(siteId, revisionId, userId) {
        const existing = await this.getOrCreate(siteId, userId);
        const revision = await this.revisionsService.restore(this.entityType, existing.id, revisionId, userId);
        if (revision.siteId !== siteId) {
            throw new common_1.NotFoundException('Revision not found');
        }
        const snapshot = revision.snapshot;
        return this.update(siteId, existing.id, {
            footerText: snapshot.footerText ?? null,
            contactEmail: snapshot.contactEmail ?? null,
            contactPhone: snapshot.contactPhone ?? null,
            contactAddress: snapshot.contactAddress ?? null,
            copyrightText: snapshot.copyrightText ?? null,
            maintenanceMode: snapshot.maintenanceMode ?? false,
            analyticsId: snapshot.analyticsId ?? null,
        }, userId);
    }
    async findPublished(siteId, requestedLocale) {
        const row = await this.repository.findOne({
            where: { siteId, status: content_status_enum_1.ContentStatus.PUBLISHED },
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
            contactAddress: this.localeResolverService.resolveText(row.contactAddress, locale, defaultLocale),
            copyrightText: this.localeResolverService.resolveText(row.copyrightText, locale, defaultLocale),
            maintenanceMode: row.maintenanceMode,
            analyticsId: row.analyticsId,
        };
    }
};
exports.SiteSettingsService = SiteSettingsService;
exports.SiteSettingsService = SiteSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(site_settings_entity_1.SiteSettings)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        revisions_service_1.RevisionsService,
        event_emitter_1.EventEmitter2,
        publishing_service_1.PublishingService,
        locale_resolver_service_1.LocaleResolverService])
], SiteSettingsService);
//# sourceMappingURL=site-settings.service.js.map