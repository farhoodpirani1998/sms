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
var PublishingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishingService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_1 = require("typeorm");
const audit_log_entity_1 = require("../../../../common/audit/audit-log.entity");
const audit_service_1 = require("../../../../common/audit/audit.service");
const content_status_enum_1 = require("../../common/enums/content-status.enum");
const cms_domain_events_1 = require("../events/cms-domain-events");
let PublishingService = PublishingService_1 = class PublishingService {
    constructor(auditService, events) {
        this.auditService = auditService;
        this.events = events;
        this.logger = new common_1.Logger(PublishingService_1.name);
        this.registrations = new Map();
    }
    registerSchedulable(descriptor) {
        this.registrations.set(descriptor.entityType, descriptor);
    }
    async publish(contentService, entityType, siteId, id, userId) {
        const publishedAt = new Date();
        const entity = await contentService.applyStatusTransition(siteId, id, { status: content_status_enum_1.ContentStatus.PUBLISHED, publishedAt, scheduledAt: null }, userId);
        this.events.emit(cms_domain_events_1.CMS_DOMAIN_EVENTS.CONTENT_PUBLISHED, new cms_domain_events_1.ContentPublishedEvent(entityType, entity.id, siteId, userId, publishedAt));
        await this.auditService.record({
            schoolId: null,
            userId,
            action: audit_log_entity_1.AuditAction.CMS_CONTENT_PUBLISHED,
            entityType,
            entityId: entity.id,
            newValue: { status: entity.status, publishedAt: entity.publishedAt },
        });
        return entity;
    }
    async unpublish(contentService, entityType, siteId, id, userId) {
        const entity = await contentService.applyStatusTransition(siteId, id, { status: content_status_enum_1.ContentStatus.DRAFT, publishedAt: null, scheduledAt: null }, userId);
        this.events.emit(cms_domain_events_1.CMS_DOMAIN_EVENTS.CONTENT_UNPUBLISHED, new cms_domain_events_1.ContentUnpublishedEvent(entityType, entity.id, siteId, userId));
        await this.auditService.record({
            schoolId: null,
            userId,
            action: audit_log_entity_1.AuditAction.CMS_CONTENT_UNPUBLISHED,
            entityType,
            entityId: entity.id,
            newValue: { status: entity.status },
        });
        return entity;
    }
    async schedule(contentService, entityType, siteId, id, scheduledAt, userId) {
        if (scheduledAt.getTime() <= Date.now()) {
            throw new common_1.BadRequestException('scheduledAt must be in the future');
        }
        const entity = await contentService.applyStatusTransition(siteId, id, { status: content_status_enum_1.ContentStatus.SCHEDULED, scheduledAt, publishedAt: null }, userId);
        this.events.emit(cms_domain_events_1.CMS_DOMAIN_EVENTS.CONTENT_SCHEDULED, new cms_domain_events_1.ContentScheduledEvent(entityType, entity.id, siteId, userId, scheduledAt));
        await this.auditService.record({
            schoolId: null,
            userId,
            action: audit_log_entity_1.AuditAction.CMS_CONTENT_SCHEDULED,
            entityType,
            entityId: entity.id,
            newValue: { status: entity.status, scheduledAt: entity.scheduledAt },
        });
        return entity;
    }
    async publishScheduled(contentService, entityType, siteId, id) {
        const publishedAt = new Date();
        const entity = await contentService.applyStatusTransition(siteId, id, { status: content_status_enum_1.ContentStatus.PUBLISHED, publishedAt, scheduledAt: null }, null);
        this.events.emit(cms_domain_events_1.CMS_DOMAIN_EVENTS.CONTENT_PUBLISHED, new cms_domain_events_1.ContentPublishedEvent(entityType, entity.id, siteId, null, publishedAt));
        await this.auditService.record({
            schoolId: null,
            userId: null,
            action: audit_log_entity_1.AuditAction.CMS_CONTENT_PUBLISHED,
            entityType,
            entityId: entity.id,
            newValue: { status: entity.status, publishedAt: entity.publishedAt },
        });
        return entity;
    }
    async runScheduledPublish(now = new Date()) {
        let publishedCount = 0;
        for (const { entityType, repository, contentService } of this.registrations.values()) {
            const dueRows = await repository.find({
                where: { status: content_status_enum_1.ContentStatus.SCHEDULED, scheduledAt: (0, typeorm_1.LessThanOrEqual)(now) },
            });
            for (const row of dueRows) {
                try {
                    await this.publishScheduled(contentService, entityType, row.siteId, row.id);
                    publishedCount += 1;
                }
                catch (err) {
                    this.logger.error(`Scheduled publish failed for ${entityType}:${row.id} (site ${row.siteId})`, err);
                }
            }
        }
        return publishedCount;
    }
};
exports.PublishingService = PublishingService;
exports.PublishingService = PublishingService = PublishingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService,
        event_emitter_1.EventEmitter2])
], PublishingService);
//# sourceMappingURL=publishing.service.js.map