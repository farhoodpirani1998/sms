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
exports.GalleryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const gallery_item_entity_1 = require("./entities/gallery-item.entity");
const base_content_service_1 = require("../../common/services/base-content.service");
const locale_resolver_service_1 = require("../../common/services/locale-resolver.service");
const cms_entity_type_enum_1 = require("../../common/enums/cms-entity-type.enum");
const content_status_enum_1 = require("../../common/enums/content-status.enum");
const revisions_service_1 = require("../../core/revisions/revisions.service");
const publishing_service_1 = require("../../core/publishing/publishing.service");
const ordering_service_1 = require("../../core/ordering/ordering.service");
const pagination_1 = require("../../../../common/utils/pagination");
let GalleryService = class GalleryService extends base_content_service_1.BaseContentService {
    constructor(repository, revisionsService, events, publishingService, orderingService, localeResolverService) {
        super(repository, cms_entity_type_enum_1.CmsEntityType.GALLERY_ITEM, revisionsService, events);
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
    async findAllByCategory(siteId, pagination, category) {
        if (!category) {
            return this.findAll(siteId, pagination);
        }
        const { page, limit, skip } = (0, pagination_1.normalizePagination)(pagination);
        const [data, total] = await this.repository.findAndCount({
            where: { siteId, category },
            order: { sortOrder: 'ASC', createdAt: 'DESC' },
            skip,
            take: limit,
        });
        return { data, total, page, limit };
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
            caption: snapshot.caption ?? null,
            mediaId: snapshot.mediaId,
            category: snapshot.category ?? null,
        }, userId);
    }
    async findPublished(siteId, requestedLocale, category) {
        const locale = await this.localeResolverService.resolve(siteId, requestedLocale);
        const defaultLocale = await this.localeResolverService.resolve(siteId);
        const where = { siteId, status: content_status_enum_1.ContentStatus.PUBLISHED };
        if (category) {
            where.category = category;
        }
        const rows = await this.repository.find({
            where: where,
            relations: ['media'],
            order: { sortOrder: 'ASC' },
        });
        return rows.map((row) => ({
            id: row.id,
            caption: this.localeResolverService.resolveText(row.caption, locale, defaultLocale),
            mediaUrl: row.media.url,
            category: row.category,
            sortOrder: row.sortOrder,
        }));
    }
};
exports.GalleryService = GalleryService;
exports.GalleryService = GalleryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(gallery_item_entity_1.GalleryItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        revisions_service_1.RevisionsService,
        event_emitter_1.EventEmitter2,
        publishing_service_1.PublishingService,
        ordering_service_1.OrderingService,
        locale_resolver_service_1.LocaleResolverService])
], GalleryService);
//# sourceMappingURL=gallery.service.js.map