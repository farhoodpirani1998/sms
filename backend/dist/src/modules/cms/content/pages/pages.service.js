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
exports.PagesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const page_entity_1 = require("./entities/page.entity");
const base_content_service_1 = require("../../common/services/base-content.service");
const cms_entity_type_enum_1 = require("../../common/enums/cms-entity-type.enum");
const content_status_enum_1 = require("../../common/enums/content-status.enum");
const revisions_service_1 = require("../../core/revisions/revisions.service");
const publishing_service_1 = require("../../core/publishing/publishing.service");
const ordering_service_1 = require("../../core/ordering/ordering.service");
const locale_resolver_service_1 = require("../../common/services/locale-resolver.service");
const site_service_1 = require("../../core/site/site.service");
let PagesService = class PagesService extends base_content_service_1.BaseContentService {
    constructor(repository, revisionsService, events, publishingService, orderingService, localeResolverService, siteService) {
        super(repository, cms_entity_type_enum_1.CmsEntityType.PAGE, revisionsService, events);
        this.publishingService = publishingService;
        this.orderingService = orderingService;
        this.localeResolverService = localeResolverService;
        this.siteService = siteService;
    }
    onModuleInit() {
        this.publishingService.registerSchedulable({
            entityType: this.entityType,
            repository: this.repository,
            contentService: this,
        });
    }
    async create(siteId, data, userId) {
        if (data.slug) {
            await this.assertSlugAvailable(siteId, data.slug);
        }
        return super.create(siteId, data, userId);
    }
    async update(siteId, id, data, userId) {
        if (data.slug) {
            await this.assertSlugAvailable(siteId, data.slug, id);
        }
        return super.update(siteId, id, data, userId);
    }
    async assertSlugAvailable(siteId, slug, excludeId) {
        const existing = await this.repository.findOne({ where: { siteId, slug } });
        if (existing && existing.id !== excludeId) {
            throw new common_1.ConflictException(`A page with slug "${slug}" already exists for this Site`);
        }
    }
    async publish(siteId, id, userId) {
        return this.publishingService.publish(this, this.entityType, siteId, id, userId);
    }
    async unpublish(siteId, id, userId) {
        return this.publishingService.unpublish(this, this.entityType, siteId, id, userId);
    }
    async schedule(siteId, id, scheduledAt, userId) {
        return this.publishingService.schedule(this, this.entityType, siteId, id, scheduledAt, userId);
    }
    async reorder(siteId, orderedIds, userId) {
        return this.orderingService.reorder(this.getRepository(), this.entityType, siteId, orderedIds, userId);
    }
    async restore(siteId, id, revisionId, userId) {
        const revision = await this.revisionsService.restore(this.entityType, id, revisionId, userId);
        if (revision.siteId !== siteId) {
            throw new common_1.NotFoundException('Revision not found');
        }
        const snapshot = revision.snapshot;
        if (snapshot.slug) {
            await this.assertSlugAvailable(siteId, snapshot.slug, id);
        }
        return this.update(siteId, id, {
            slug: snapshot.slug,
            title: snapshot.title,
            excerpt: snapshot.excerpt ?? null,
            body: snapshot.body ?? null,
            metaTitle: snapshot.metaTitle ?? null,
            metaDescription: snapshot.metaDescription ?? null,
            ogImageMediaId: snapshot.ogImageMediaId ?? null,
        }, userId);
    }
    async findPublishedBySlug(siteId, slug, requestedLocale) {
        const page = await this.repository.findOne({
            where: { siteId, slug, status: content_status_enum_1.ContentStatus.PUBLISHED },
            relations: ['ogImageMedia'],
        });
        if (!page) {
            return null;
        }
        const site = await this.siteService.findOne(siteId);
        const locale = await this.localeResolverService.resolve(siteId, requestedLocale);
        const defaultLocale = await this.localeResolverService.resolve(siteId);
        const title = this.localeResolverService.resolveText(page.title, locale, defaultLocale);
        const excerpt = this.localeResolverService.resolveText(page.excerpt, locale, defaultLocale);
        const body = this.localeResolverService.resolveText(page.body, locale, defaultLocale);
        const seoTitle = this.localeResolverService.resolveText(page.metaTitle, locale, defaultLocale) ??
            title ??
            this.resolveSiteSeoText(site.seoDefaults?.title, locale, defaultLocale);
        const seoDescription = this.localeResolverService.resolveText(page.metaDescription, locale, defaultLocale) ??
            this.resolveSiteSeoText(site.seoDefaults?.description, locale, defaultLocale);
        const seo = {
            title: seoTitle ?? null,
            description: seoDescription ?? null,
            ogImageUrl: page.ogImageMedia?.url ?? null,
            canonicalUrl: `https://${site.domain}/${page.slug}`,
        };
        return {
            id: page.id,
            slug: page.slug,
            title,
            excerpt,
            body,
            seo,
        };
    }
    resolveSiteSeoText(localized, locale, defaultLocale) {
        if (!localized) {
            return null;
        }
        return this.localeResolverService.resolveText(localized, locale, defaultLocale);
    }
};
exports.PagesService = PagesService;
exports.PagesService = PagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(page_entity_1.Page)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        revisions_service_1.RevisionsService,
        event_emitter_1.EventEmitter2,
        publishing_service_1.PublishingService,
        ordering_service_1.OrderingService,
        locale_resolver_service_1.LocaleResolverService,
        site_service_1.SiteService])
], PagesService);
//# sourceMappingURL=pages.service.js.map