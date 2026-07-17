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
exports.NavigationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const navigation_item_entity_1 = require("./entities/navigation-item.entity");
const base_content_service_1 = require("../../common/services/base-content.service");
const locale_resolver_service_1 = require("../../common/services/locale-resolver.service");
const cms_entity_type_enum_1 = require("../../common/enums/cms-entity-type.enum");
const content_status_enum_1 = require("../../common/enums/content-status.enum");
const revisions_service_1 = require("../../core/revisions/revisions.service");
const publishing_service_1 = require("../../core/publishing/publishing.service");
const ordering_service_1 = require("../../core/ordering/ordering.service");
let NavigationService = class NavigationService extends base_content_service_1.BaseContentService {
    constructor(repository, revisionsService, events, publishingService, orderingService, localeResolverService) {
        super(repository, cms_entity_type_enum_1.CmsEntityType.NAVIGATION_ITEM, revisionsService, events);
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
    async restore(siteId, id, revisionId, userId) {
        const revision = await this.revisionsService.restore(this.entityType, id, revisionId, userId);
        if (revision.siteId !== siteId) {
            throw new common_1.NotFoundException('Revision not found');
        }
        const snapshot = revision.snapshot;
        return this.update(siteId, id, {
            label: snapshot.label,
            url: snapshot.url ?? null,
        }, userId);
    }
    async reorder(siteId, parentId, orderedIds, userId) {
        if (orderedIds.length === 0) {
            return;
        }
        const normalizedParentId = parentId ?? null;
        const siblings = await this.repository.find({
            where: { siteId, parentId: normalizedParentId },
        });
        const siblingIds = new Set(siblings.map((row) => row.id));
        const allBelongToParent = orderedIds.every((id) => siblingIds.has(id));
        if (!allBelongToParent || orderedIds.length !== siblingIds.size) {
            throw new common_1.BadRequestException('orderedIds must exactly match the set of items under the given parent');
        }
        return this.orderingService.reorder(this.getRepository(), this.entityType, siteId, orderedIds, userId);
    }
    async reparent(siteId, id, newParentId, userId) {
        const entity = await this.findOne(siteId, id);
        const normalizedParentId = newParentId ?? null;
        if (normalizedParentId === id) {
            throw new common_1.BadRequestException('An item cannot be its own parent');
        }
        if (normalizedParentId) {
            const newParent = await this.repository.findOne({
                where: { id: normalizedParentId, siteId },
            });
            if (!newParent) {
                throw new common_1.NotFoundException('Parent navigation item not found');
            }
            const descendantIds = await this.collectDescendantIds(siteId, id);
            if (descendantIds.has(normalizedParentId)) {
                throw new common_1.BadRequestException('Cannot move an item under its own descendant');
            }
        }
        entity.parentId = normalizedParentId;
        entity.updatedById = userId;
        const saved = await this.repository.save(entity);
        await this.snapshotRevision(saved, userId);
        return saved;
    }
    async findPublishedTree(siteId, requestedLocale) {
        const locale = await this.localeResolverService.resolve(siteId, requestedLocale);
        const defaultLocale = await this.localeResolverService.resolve(siteId);
        const rows = await this.repository.find({
            where: { siteId, status: content_status_enum_1.ContentStatus.PUBLISHED },
            order: { sortOrder: 'ASC' },
        });
        const byParent = new Map();
        for (const row of rows) {
            const key = row.parentId ?? null;
            const bucket = byParent.get(key) ?? [];
            bucket.push(row);
            byParent.set(key, bucket);
        }
        const build = (parentId) => {
            const children = byParent.get(parentId) ?? [];
            return children.map((row) => ({
                id: row.id,
                label: this.localeResolverService.resolveText(row.label, locale, defaultLocale),
                url: row.url,
                sortOrder: row.sortOrder,
                children: build(row.id),
            }));
        };
        return build(null);
    }
    async collectDescendantIds(siteId, rootId) {
        const all = await this.repository.find({ where: { siteId } });
        const childrenByParent = new Map();
        for (const row of all) {
            if (!row.parentId)
                continue;
            const bucket = childrenByParent.get(row.parentId) ?? [];
            bucket.push(row.id);
            childrenByParent.set(row.parentId, bucket);
        }
        const descendants = new Set();
        const queue = [...(childrenByParent.get(rootId) ?? [])];
        while (queue.length > 0) {
            const current = queue.shift();
            if (descendants.has(current))
                continue;
            descendants.add(current);
            queue.push(...(childrenByParent.get(current) ?? []));
        }
        return descendants;
    }
};
exports.NavigationService = NavigationService;
exports.NavigationService = NavigationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(navigation_item_entity_1.NavigationItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        revisions_service_1.RevisionsService,
        event_emitter_1.EventEmitter2,
        publishing_service_1.PublishingService,
        ordering_service_1.OrderingService,
        locale_resolver_service_1.LocaleResolverService])
], NavigationService);
//# sourceMappingURL=navigation.service.js.map