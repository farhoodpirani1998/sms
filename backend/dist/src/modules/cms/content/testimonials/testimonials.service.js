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
exports.TestimonialsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const testimonial_entity_1 = require("./entities/testimonial.entity");
const base_content_service_1 = require("../../common/services/base-content.service");
const locale_resolver_service_1 = require("../../common/services/locale-resolver.service");
const cms_entity_type_enum_1 = require("../../common/enums/cms-entity-type.enum");
const content_status_enum_1 = require("../../common/enums/content-status.enum");
const revisions_service_1 = require("../../core/revisions/revisions.service");
const publishing_service_1 = require("../../core/publishing/publishing.service");
const ordering_service_1 = require("../../core/ordering/ordering.service");
let TestimonialsService = class TestimonialsService extends base_content_service_1.BaseContentService {
    constructor(repository, revisionsService, events, publishingService, orderingService, localeResolverService) {
        super(repository, cms_entity_type_enum_1.CmsEntityType.TESTIMONIAL, revisionsService, events);
        this.publishingService = publishingService;
        this.orderingService = orderingService;
        this.localeResolverService = localeResolverService;
    }
    onModuleInit() {
        this.publishingService.registerSchedulable({
            entityType: this.entityType,
            repository: this.repository,
            contentService: this,
        });
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
        return this.update(siteId, id, {
            quote: snapshot.quote,
            authorName: snapshot.authorName,
            authorRole: snapshot.authorRole ?? null,
            avatarMediaId: snapshot.avatarMediaId ?? null,
            rating: snapshot.rating ?? null,
        }, userId);
    }
    async findPublished(siteId, requestedLocale) {
        const locale = await this.localeResolverService.resolve(siteId, requestedLocale);
        const defaultLocale = await this.localeResolverService.resolve(siteId);
        const rows = await this.repository.find({
            where: { siteId, status: content_status_enum_1.ContentStatus.PUBLISHED },
            relations: ['avatarMedia'],
            order: { sortOrder: 'ASC' },
        });
        return rows.map((row) => ({
            id: row.id,
            quote: this.localeResolverService.resolveText(row.quote, locale, defaultLocale),
            authorName: row.authorName,
            authorRole: this.localeResolverService.resolveText(row.authorRole, locale, defaultLocale),
            avatarUrl: row.avatarMedia?.url ?? null,
            rating: row.rating,
            sortOrder: row.sortOrder,
        }));
    }
};
exports.TestimonialsService = TestimonialsService;
exports.TestimonialsService = TestimonialsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(testimonial_entity_1.Testimonial)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        revisions_service_1.RevisionsService,
        event_emitter_1.EventEmitter2,
        publishing_service_1.PublishingService,
        ordering_service_1.OrderingService,
        locale_resolver_service_1.LocaleResolverService])
], TestimonialsService);
//# sourceMappingURL=testimonials.service.js.map