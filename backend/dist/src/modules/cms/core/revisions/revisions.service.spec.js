"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const revisions_service_1 = require("./revisions.service");
const cms_entity_type_enum_1 = require("../../common/enums/cms-entity-type.enum");
const cms_domain_events_1 = require("../events/cms-domain-events");
function fakeRepository(rows = []) {
    let sequence = 0;
    return {
        create: jest.fn().mockImplementation((data) => ({
            id: `revision-${rows.length + 1}`,
            createdAt: new Date(Date.now() + sequence++),
            ...data,
        })),
        save: jest.fn().mockImplementation(async (entity) => {
            rows.push(entity);
            return entity;
        }),
        find: jest.fn().mockImplementation(async ({ where }) => {
            return rows
                .filter((r) => r.entityType === where.entityType && r.entityId === where.entityId)
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }),
        findOne: jest.fn().mockImplementation(async ({ where }) => {
            return (rows.find((r) => r.id === where.id && r.entityType === where.entityType && r.entityId === where.entityId) ?? null);
        }),
    };
}
describe('RevisionsService', () => {
    it('snapshots a fake payload and lists it back, most recent first', async () => {
        const rows = [];
        const repository = fakeRepository(rows);
        const events = { emit: jest.fn() };
        const service = new revisions_service_1.RevisionsService(repository, events);
        await service.snapshot(cms_entity_type_enum_1.CmsEntityType.MEDIA_ASSET, 'entity-1', 'site-1', { title: 'first draft' }, 'user-1');
        await service.snapshot(cms_entity_type_enum_1.CmsEntityType.MEDIA_ASSET, 'entity-1', 'site-1', { title: 'second draft' }, 'user-1');
        const revisions = await service.list(cms_entity_type_enum_1.CmsEntityType.MEDIA_ASSET, 'entity-1');
        expect(revisions).toHaveLength(2);
        expect(revisions[0].snapshot).toEqual({ title: 'second draft' });
        expect(revisions[1].snapshot).toEqual({ title: 'first draft' });
    });
    it('rejects list() for an entity type outside the closed CmsEntityType set', async () => {
        const service = new revisions_service_1.RevisionsService(fakeRepository(), { emit: jest.fn() });
        await expect(service.list('not_a_real_type', 'entity-1')).rejects.toThrow(common_1.BadRequestException);
    });
    it('restores a revision, emits REVISION_RESTORED, and returns the snapshot', async () => {
        const rows = [];
        const repository = fakeRepository(rows);
        const events = { emit: jest.fn() };
        const service = new revisions_service_1.RevisionsService(repository, events);
        const revision = await service.snapshot(cms_entity_type_enum_1.CmsEntityType.MEDIA_ASSET, 'entity-1', 'site-1', { title: 'draft to restore' }, 'user-1');
        const restored = await service.restore(cms_entity_type_enum_1.CmsEntityType.MEDIA_ASSET, 'entity-1', revision.id, 'user-2');
        expect(restored.snapshot).toEqual({ title: 'draft to restore' });
        expect(events.emit).toHaveBeenCalledWith(cms_domain_events_1.CMS_DOMAIN_EVENTS.REVISION_RESTORED, expect.objectContaining({
            entityType: cms_entity_type_enum_1.CmsEntityType.MEDIA_ASSET,
            entityId: 'entity-1',
            siteId: 'site-1',
            revisionId: revision.id,
            performedBy: 'user-2',
        }));
    });
    it('throws NotFoundException restoring a revision id that belongs to a different entity', async () => {
        const rows = [];
        const repository = fakeRepository(rows);
        const service = new revisions_service_1.RevisionsService(repository, { emit: jest.fn() });
        const revision = await service.snapshot(cms_entity_type_enum_1.CmsEntityType.MEDIA_ASSET, 'entity-1', 'site-1', { title: 'belongs to entity-1' }, 'user-1');
        await expect(service.restore(cms_entity_type_enum_1.CmsEntityType.MEDIA_ASSET, 'entity-2', revision.id, 'user-2')).rejects.toThrow(common_1.NotFoundException);
    });
});
//# sourceMappingURL=revisions.service.spec.js.map