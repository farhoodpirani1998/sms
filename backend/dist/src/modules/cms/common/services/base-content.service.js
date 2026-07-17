"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseContentService = void 0;
const common_1 = require("@nestjs/common");
const pagination_1 = require("../../../../common/utils/pagination");
const cms_domain_events_1 = require("../../core/events/cms-domain-events");
class BaseContentService {
    constructor(repository, entityType, revisionsService, events) {
        this.repository = repository;
        this.entityType = entityType;
        this.revisionsService = revisionsService;
        this.events = events;
    }
    async create(siteId, data, userId) {
        const entity = this.repository.create({
            ...data,
            siteId,
            createdById: userId,
            updatedById: userId,
        });
        const saved = await this.repository.save(entity);
        await this.snapshotRevision(saved, userId);
        this.events.emit(cms_domain_events_1.CMS_DOMAIN_EVENTS.CONTENT_CREATED, new cms_domain_events_1.ContentCreatedEvent(this.entityType, saved.id, saved.siteId, userId));
        return saved;
    }
    async findAll(siteId, pagination = {}) {
        const { page, limit, skip } = (0, pagination_1.normalizePagination)(pagination);
        const [data, total] = await this.repository.findAndCount({
            where: { siteId },
            order: { sortOrder: 'ASC', createdAt: 'DESC' },
            skip,
            take: limit,
        });
        return { data, total, page, limit };
    }
    async findOne(siteId, id) {
        const entity = await this.repository.findOne({
            where: { id, siteId },
        });
        if (!entity) {
            throw new common_1.NotFoundException(`${this.entityType} not found`);
        }
        return entity;
    }
    async update(siteId, id, data, userId) {
        const entity = await this.findOne(siteId, id);
        Object.assign(entity, data, { updatedById: userId });
        const saved = await this.repository.save(entity);
        await this.snapshotRevision(saved, userId);
        this.events.emit(cms_domain_events_1.CMS_DOMAIN_EVENTS.CONTENT_UPDATED, new cms_domain_events_1.ContentUpdatedEvent(this.entityType, saved.id, saved.siteId, userId));
        return saved;
    }
    async remove(siteId, id, userId) {
        const entity = await this.findOne(siteId, id);
        await this.repository.remove(entity);
        this.events.emit(cms_domain_events_1.CMS_DOMAIN_EVENTS.CONTENT_DELETED, new cms_domain_events_1.ContentDeletedEvent(this.entityType, id, siteId, userId));
    }
    async applyStatusTransition(siteId, id, patch, userId) {
        const entity = await this.findOne(siteId, id);
        Object.assign(entity, patch);
        if (userId) {
            entity.updatedById = userId;
        }
        const saved = await this.repository.save(entity);
        await this.snapshotRevision(saved, userId);
        return saved;
    }
    getRepository() {
        return this.repository;
    }
    async snapshotRevision(entity, userId) {
        await this.revisionsService.snapshot(this.entityType, entity.id, entity.siteId, entity, userId);
    }
}
exports.BaseContentService = BaseContentService;
//# sourceMappingURL=base-content.service.js.map