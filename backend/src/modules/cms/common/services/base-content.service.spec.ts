import { NotFoundException } from '@nestjs/common';
import { BaseContentService } from './base-content.service';
import { BaseCmsEntity } from '../entities/base-cms.entity';
import { CmsEntityType } from '../enums/cms-entity-type.enum';
import { CMS_DOMAIN_EVENTS } from '../../core/events/cms-domain-events';

/**
 * `TestBlock` — a minimal in-memory stand-in for a real `content/*`
 * entity, used only to prove `BaseContentService` is extendable and
 * generic (per CMS-C.3's build verification). Not a real table; the
 * actual proof-against-a-real-entity happens in CMS-C.5.
 */
class TestBlock extends BaseCmsEntity {
  title: string;
}

class TestBlockService extends BaseContentService<TestBlock> {
  constructor(repository: any, revisionsService: any, events: any) {
    super(repository, CmsEntityType.MEDIA_ASSET, revisionsService, events);
  }
}

function fakeRepository(rows: TestBlock[] = []) {
  let counter = rows.length;
  return {
    create: jest.fn().mockImplementation((data: Partial<TestBlock>) => ({
      id: data.id ?? `block-${++counter}`,
      sortOrder: 0,
      status: 'draft',
      publishedAt: null,
      scheduledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    })),
    save: jest.fn().mockImplementation(async (entity: TestBlock) => {
      const index = rows.findIndex((r) => r.id === entity.id);
      if (index === -1) {
        rows.push(entity);
      } else {
        rows[index] = entity;
      }
      return entity;
    }),
    findOne: jest.fn().mockImplementation(async ({ where }: any) => {
      return rows.find((r) => r.id === where.id && r.siteId === where.siteId) ?? null;
    }),
    findAndCount: jest.fn().mockImplementation(async ({ where, skip, take }: any) => {
      const filtered = rows.filter((r) => r.siteId === where.siteId);
      return [filtered.slice(skip, skip + take), filtered.length];
    }),
    remove: jest.fn().mockImplementation(async (entity: TestBlock) => {
      const index = rows.findIndex((r) => r.id === entity.id);
      if (index !== -1) {
        rows.splice(index, 1);
      }
      return entity;
    }),
  } as any;
}

function fakeRevisionsService() {
  return { snapshot: jest.fn().mockResolvedValue(undefined) } as any;
}

function fakeEvents() {
  return { emit: jest.fn() } as any;
}

describe('BaseContentService', () => {
  it('creates an entity, snapshots a revision, and emits CONTENT_CREATED', async () => {
    const rows: TestBlock[] = [];
    const revisionsService = fakeRevisionsService();
    const events = fakeEvents();
    const service = new TestBlockService(fakeRepository(rows), revisionsService, events);

    const created = await service.create('site-1', { title: 'first draft' } as any, 'user-1');

    expect(created.siteId).toBe('site-1');
    expect(created.createdById).toBe('user-1');
    expect(revisionsService.snapshot).toHaveBeenCalledWith(
      CmsEntityType.MEDIA_ASSET,
      created.id,
      'site-1',
      expect.objectContaining({ title: 'first draft' }),
      'user-1',
    );
    expect(events.emit).toHaveBeenCalledWith(
      CMS_DOMAIN_EVENTS.CONTENT_CREATED,
      expect.objectContaining({ entityId: created.id, siteId: 'site-1', performedBy: 'user-1' }),
    );
  });

  it('scopes findOne by siteId and throws NotFoundException across sites', async () => {
    const repository = fakeRepository();
    const service = new TestBlockService(repository, fakeRevisionsService(), fakeEvents());

    const created = await service.create('site-1', { title: 'scoped' } as any, 'user-1');

    await expect(service.findOne('site-1', created.id)).resolves.toEqual(created);
    await expect(service.findOne('site-2', created.id)).rejects.toThrow(NotFoundException);
  });

  it('updates an entity, snapshots a new revision, and emits CONTENT_UPDATED', async () => {
    const revisionsService = fakeRevisionsService();
    const events = fakeEvents();
    const service = new TestBlockService(fakeRepository(), revisionsService, events);

    const created = await service.create('site-1', { title: 'v1' } as any, 'user-1');
    const updated = await service.update('site-1', created.id, { title: 'v2' } as any, 'user-2');

    expect(updated.title).toBe('v2');
    expect(updated.updatedById).toBe('user-2');
    expect(revisionsService.snapshot).toHaveBeenCalledTimes(2);
    expect(events.emit).toHaveBeenCalledWith(
      CMS_DOMAIN_EVENTS.CONTENT_UPDATED,
      expect.objectContaining({ entityId: created.id, performedBy: 'user-2' }),
    );
  });

  it('paginates findAll results scoped by siteId', async () => {
    const service = new TestBlockService(fakeRepository(), fakeRevisionsService(), fakeEvents());

    for (let i = 0; i < 3; i += 1) {
      await service.create('site-1', { title: `item-${i}` } as any, 'user-1');
    }
    await service.create('site-2', { title: 'other site' } as any, 'user-1');

    const page = await service.findAll('site-1', { page: 1, limit: 2 });

    expect(page.total).toBe(3);
    expect(page.data).toHaveLength(2);
    expect(page.page).toBe(1);
    expect(page.limit).toBe(2);
  });

  it('removes an entity and emits CONTENT_DELETED', async () => {
    const events = fakeEvents();
    const service = new TestBlockService(fakeRepository(), fakeRevisionsService(), events);

    const created = await service.create('site-1', { title: 'to delete' } as any, 'user-1');
    await service.remove('site-1', created.id, 'user-1');

    await expect(service.findOne('site-1', created.id)).rejects.toThrow(NotFoundException);
    expect(events.emit).toHaveBeenCalledWith(
      CMS_DOMAIN_EVENTS.CONTENT_DELETED,
      expect.objectContaining({ entityId: created.id, performedBy: 'user-1' }),
    );
  });

  it('applyStatusTransition flips status fields and snapshots without emitting an event', async () => {
    const revisionsService = fakeRevisionsService();
    const events = fakeEvents();
    const service = new TestBlockService(fakeRepository(), revisionsService, events);

    const created = await service.create('site-1', { title: 'to publish' } as any, 'user-1');
    const now = new Date();

    const published = await service.applyStatusTransition(
      'site-1',
      created.id,
      { status: 'published' as any, publishedAt: now },
      null,
    );

    expect(published.status).toBe('published');
    expect(published.publishedAt).toBe(now);
    expect(revisionsService.snapshot).toHaveBeenCalledTimes(2);
    expect(events.emit).not.toHaveBeenCalledWith(
      CMS_DOMAIN_EVENTS.CONTENT_PUBLISHED,
      expect.anything(),
    );
  });
});
