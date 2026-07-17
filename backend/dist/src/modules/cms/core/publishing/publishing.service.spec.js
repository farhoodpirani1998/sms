"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const publishing_service_1 = require("./publishing.service");
const content_status_enum_1 = require("../../common/enums/content-status.enum");
const cms_entity_type_enum_1 = require("../../common/enums/cms-entity-type.enum");
const audit_log_entity_1 = require("../../../../common/audit/audit-log.entity");
const cms_domain_events_1 = require("../events/cms-domain-events");
function fakeAuditService() {
    return { record: jest.fn().mockResolvedValue(undefined) };
}
function fakeEvents() {
    return { emit: jest.fn() };
}
function fakeContentService(entity) {
    return {
        applyStatusTransition: jest.fn().mockImplementation(async (_siteId, id, patch) => ({
            ...entity,
            id,
            ...patch,
        })),
    };
}
describe('PublishingService', () => {
    it('publish() flips status to PUBLISHED, emits the event, and writes an audit row', async () => {
        const auditService = fakeAuditService();
        const events = fakeEvents();
        const service = new publishing_service_1.PublishingService(auditService, events);
        const contentService = fakeContentService({ id: 'block-1', siteId: 'site-1' });
        const result = await service.publish(contentService, cms_entity_type_enum_1.CmsEntityType.MEDIA_ASSET, 'site-1', 'block-1', 'user-1');
        expect(result.status).toBe(content_status_enum_1.ContentStatus.PUBLISHED);
        expect(contentService.applyStatusTransition).toHaveBeenCalledWith('site-1', 'block-1', expect.objectContaining({ status: content_status_enum_1.ContentStatus.PUBLISHED, scheduledAt: null }), 'user-1');
        expect(events.emit).toHaveBeenCalledWith(cms_domain_events_1.CMS_DOMAIN_EVENTS.CONTENT_PUBLISHED, expect.objectContaining({ entityId: 'block-1', siteId: 'site-1', performedBy: 'user-1' }));
        expect(auditService.record).toHaveBeenCalledWith(expect.objectContaining({ schoolId: null, userId: 'user-1', action: audit_log_entity_1.AuditAction.CMS_CONTENT_PUBLISHED }));
    });
    it('unpublish() flips status back to DRAFT and clears publishedAt', async () => {
        const auditService = fakeAuditService();
        const events = fakeEvents();
        const service = new publishing_service_1.PublishingService(auditService, events);
        const contentService = fakeContentService({ id: 'block-1', siteId: 'site-1' });
        const result = await service.unpublish(contentService, cms_entity_type_enum_1.CmsEntityType.MEDIA_ASSET, 'site-1', 'block-1', 'user-1');
        expect(result.status).toBe(content_status_enum_1.ContentStatus.DRAFT);
        expect(result.publishedAt).toBeNull();
        expect(events.emit).toHaveBeenCalledWith(cms_domain_events_1.CMS_DOMAIN_EVENTS.CONTENT_UNPUBLISHED, expect.objectContaining({ entityId: 'block-1' }));
        expect(auditService.record).toHaveBeenCalledWith(expect.objectContaining({ action: audit_log_entity_1.AuditAction.CMS_CONTENT_UNPUBLISHED }));
    });
    it('schedule() rejects a scheduledAt that is not in the future', async () => {
        const service = new publishing_service_1.PublishingService(fakeAuditService(), fakeEvents());
        const contentService = fakeContentService({ id: 'block-1', siteId: 'site-1' });
        const past = new Date(Date.now() - 60_000);
        await expect(service.schedule(contentService, cms_entity_type_enum_1.CmsEntityType.MEDIA_ASSET, 'site-1', 'block-1', past, 'user-1')).rejects.toThrow(common_1.BadRequestException);
    });
    it('schedule() flips status to SCHEDULED for a future date', async () => {
        const auditService = fakeAuditService();
        const events = fakeEvents();
        const service = new publishing_service_1.PublishingService(auditService, events);
        const contentService = fakeContentService({ id: 'block-1', siteId: 'site-1' });
        const future = new Date(Date.now() + 60_000);
        const result = await service.schedule(contentService, cms_entity_type_enum_1.CmsEntityType.MEDIA_ASSET, 'site-1', 'block-1', future, 'user-1');
        expect(result.status).toBe(content_status_enum_1.ContentStatus.SCHEDULED);
        expect(result.scheduledAt).toBe(future);
        expect(events.emit).toHaveBeenCalledWith(cms_domain_events_1.CMS_DOMAIN_EVENTS.CONTENT_SCHEDULED, expect.objectContaining({ scheduledAt: future }));
    });
    it('runScheduledPublish() publishes only due rows for registered content types, with no acting user', async () => {
        const auditService = fakeAuditService();
        const events = fakeEvents();
        const service = new publishing_service_1.PublishingService(auditService, events);
        const dueRow = { id: 'due-1', siteId: 'site-1', status: content_status_enum_1.ContentStatus.SCHEDULED };
        const notYetDueRow = { id: 'not-due-1', siteId: 'site-1', status: content_status_enum_1.ContentStatus.SCHEDULED };
        const contentService = fakeContentService({});
        const repository = {
            find: jest.fn().mockResolvedValue([dueRow]),
        };
        service.registerSchedulable({
            entityType: cms_entity_type_enum_1.CmsEntityType.MEDIA_ASSET,
            repository,
            contentService,
        });
        const count = await service.runScheduledPublish();
        expect(count).toBe(1);
        expect(contentService.applyStatusTransition).toHaveBeenCalledWith('site-1', 'due-1', expect.objectContaining({ status: content_status_enum_1.ContentStatus.PUBLISHED }), null);
        expect(events.emit).toHaveBeenCalledWith(cms_domain_events_1.CMS_DOMAIN_EVENTS.CONTENT_PUBLISHED, expect.objectContaining({ entityId: 'due-1', performedBy: null }));
        expect(auditService.record).toHaveBeenCalledWith(expect.objectContaining({ userId: null, action: audit_log_entity_1.AuditAction.CMS_CONTENT_PUBLISHED }));
        expect(notYetDueRow.status).toBe(content_status_enum_1.ContentStatus.SCHEDULED);
    });
    it('runScheduledPublish() logs and continues when one row fails to publish', async () => {
        const events = fakeEvents();
        const service = new publishing_service_1.PublishingService(fakeAuditService(), events);
        const okRow = { id: 'ok-1', siteId: 'site-1' };
        const badRow = { id: 'bad-1', siteId: 'site-1' };
        const contentService = {
            applyStatusTransition: jest.fn().mockImplementation(async (_siteId, id) => {
                if (id === 'bad-1') {
                    throw new Error('boom');
                }
                return { id, siteId: 'site-1', status: content_status_enum_1.ContentStatus.PUBLISHED };
            }),
        };
        service.registerSchedulable({
            entityType: cms_entity_type_enum_1.CmsEntityType.MEDIA_ASSET,
            repository: { find: jest.fn().mockResolvedValue([badRow, okRow]) },
            contentService,
        });
        const count = await service.runScheduledPublish();
        expect(count).toBe(1);
    });
});
//# sourceMappingURL=publishing.service.spec.js.map