"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const base_content_service_1 = require("./base-content.service");
const base_cms_entity_1 = require("../entities/base-cms.entity");
const cms_entity_type_enum_1 = require("../enums/cms-entity-type.enum");
const cms_domain_events_1 = require("../../core/events/cms-domain-events");
class TestBlock extends base_cms_entity_1.BaseCmsEntity {
}
class TestBlockService extends base_content_service_1.BaseContentService {
    constructor(repository, revisionsService, events) {
        super(repository, cms_entity_type_enum_1.CmsEntityType.MEDIA_ASSET, revisionsService, events);
    }
}
function fakeRepository(rows = []) {
    let counter = rows.length;
    return {
        create: jest.fn().mockImplementation((data) => ({
            id: data.id ?? `block-${++counter}`,
            sortOrder: 0,
            status: 'draft',
            publishedAt: null,
            scheduledAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
        })),
        save: jest.fn().mockImplementation(async (entity) => {
            const index = rows.findIndex((r) => r.id === entity.id);
            if (index === -1) {
                rows.push(entity);
            }
            else {
                rows[index] = entity;
            }
            return entity;
        }),
        findOne: jest.fn().mockImplementation(async ({ where }) => {
            return rows.find((r) => r.id === where.id && r.siteId === where.siteId) ?? null;
        }),
        findAndCount: jest.fn().mockImplementation(async ({ where, skip, take }) => {
            const filtered = rows.filter((r) => r.siteId === where.siteId);
            return [filtered.slice(skip, skip + take), filtered.length];
        }),
        remove: jest.fn().mockImplementation(async (entity) => {
            const index = rows.findIndex((r) => r.id === entity.id);
            if (index !== -1) {
                rows.splice(index, 1);
            }
            return entity;
        }),
    };
}
function fakeRevisionsService() {
    return { snapshot: jest.fn().mockResolvedValue(undefined) };
}
function fakeEvents() {
    return { emit: jest.fn() };
}
describe('BaseContentService', () => {
    it('creates an entity, snapshots a revision, and emits CONTENT_CREATED', async () => {
        const rows = [];
        const revisionsService = fakeRevisionsService();
        const events = fakeEvents();
        const service = new TestBlockService(fakeRepository(rows), revisionsService, events);
        const created = await service.create('site-1', { title: 'first draft' }, 'user-1');
        expect(created.siteId).toBe('site-1');
        expect(created.createdById).toBe('user-1');
        expect(revisionsService.snapshot).toHaveBeenCalledWith(cms_entity_type_enum_1.CmsEntityType.MEDIA_ASSET, created.id, 'site-1', expect.objectContaining({ title: 'first draft' }), 'user-1');
        expect(events.emit).toHaveBeenCalledWith(cms_domain_events_1.CMS_DOMAIN_EVENTS.CONTENT_CREATED, expect.objectContaining({ entityId: created.id, siteId: 'site-1', performedBy: 'user-1' }));
    });
    it('scopes findOne by siteId and throws NotFoundException across sites', async () => {
        const repository = fakeRepository();
        const service = new TestBlockService(repository, fakeRevisionsService(), fakeEvents());
        const created = await service.create('site-1', { title: 'scoped' }, 'user-1');
        await expect(service.findOne('site-1', created.id)).resolves.toEqual(created);
        await expect(service.findOne('site-2', created.id)).rejects.toThrow(common_1.NotFoundException);
    });
    it('updates an entity, snapshots a new revision, and emits CONTENT_UPDATED', async () => {
        const revisionsService = fakeRevisionsService();
        const events = fakeEvents();
        const service = new TestBlockService(fakeRepository(), revisionsService, events);
        const created = await service.create('site-1', { title: 'v1' }, 'user-1');
        const updated = await service.update('site-1', created.id, { title: 'v2' }, 'user-2');
        expect(updated.title).toBe('v2');
        expect(updated.updatedById).toBe('user-2');
        expect(revisionsService.snapshot).toHaveBeenCalledTimes(2);
        expect(events.emit).toHaveBeenCalledWith(cms_domain_events_1.CMS_DOMAIN_EVENTS.CONTENT_UPDATED, expect.objectContaining({ entityId: created.id, performedBy: 'user-2' }));
    });
    it('paginates findAll results scoped by siteId', async () => {
        const service = new TestBlockService(fakeRepository(), fakeRevisionsService(), fakeEvents());
        for (let i = 0; i < 3; i += 1) {
            await service.create('site-1', { title: `item-${i}` }, 'user-1');
        }
        await service.create('site-2', { title: 'other site' }, 'user-1');
        const page = await service.findAll('site-1', { page: 1, limit: 2 });
        expect(page.total).toBe(3);
        expect(page.data).toHaveLength(2);
        expect(page.page).toBe(1);
        expect(page.limit).toBe(2);
    });
    it('removes an entity and emits CONTENT_DELETED', async () => {
        const events = fakeEvents();
        const service = new TestBlockService(fakeRepository(), fakeRevisionsService(), events);
        const created = await service.create('site-1', { title: 'to delete' }, 'user-1');
        await service.remove('site-1', created.id, 'user-1');
        await expect(service.findOne('site-1', created.id)).rejects.toThrow(common_1.NotFoundException);
        expect(events.emit).toHaveBeenCalledWith(cms_domain_events_1.CMS_DOMAIN_EVENTS.CONTENT_DELETED, expect.objectContaining({ entityId: created.id, performedBy: 'user-1' }));
    });
    it('applyStatusTransition flips status fields and snapshots without emitting an event', async () => {
        const revisionsService = fakeRevisionsService();
        const events = fakeEvents();
        const service = new TestBlockService(fakeRepository(), revisionsService, events);
        const created = await service.create('site-1', { title: 'to publish' }, 'user-1');
        const now = new Date();
        const published = await service.applyStatusTransition('site-1', created.id, { status: 'published', publishedAt: now }, null);
        expect(published.status).toBe('published');
        expect(published.publishedAt).toBe(now);
        expect(revisionsService.snapshot).toHaveBeenCalledTimes(2);
        expect(events.emit).not.toHaveBeenCalledWith(cms_domain_events_1.CMS_DOMAIN_EVENTS.CONTENT_PUBLISHED, expect.anything());
    });
});
//# sourceMappingURL=base-content.service.spec.js.map