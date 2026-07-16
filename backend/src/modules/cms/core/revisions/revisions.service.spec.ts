import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RevisionsService } from './revisions.service';
import { ContentRevision } from './entities/content-revision.entity';
import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';
import { CMS_DOMAIN_EVENTS } from '../events/cms-domain-events';

function fakeRepository(rows: ContentRevision[] = []) {
  return {
    create: jest.fn().mockImplementation((data: Partial<ContentRevision>) => ({
      id: `revision-${rows.length + 1}`,
      createdAt: new Date(),
      ...data,
    })),
    save: jest.fn().mockImplementation(async (entity: ContentRevision) => {
      rows.push(entity);
      return entity;
    }),
    find: jest.fn().mockImplementation(async ({ where }: any) => {
      return rows
        .filter((r) => r.entityType === where.entityType && r.entityId === where.entityId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }),
    findOne: jest.fn().mockImplementation(async ({ where }: any) => {
      return (
        rows.find(
          (r) =>
            r.id === where.id && r.entityType === where.entityType && r.entityId === where.entityId,
        ) ?? null
      );
    }),
  } as any;
}

describe('RevisionsService', () => {
  it('snapshots a fake payload and lists it back, most recent first', async () => {
    const rows: ContentRevision[] = [];
    const repository = fakeRepository(rows);
    const events = { emit: jest.fn() } as any;
    const service = new RevisionsService(repository, events);

    await service.snapshot(
      CmsEntityType.MEDIA_ASSET,
      'entity-1',
      'site-1',
      { title: 'first draft' },
      'user-1',
    );
    await service.snapshot(
      CmsEntityType.MEDIA_ASSET,
      'entity-1',
      'site-1',
      { title: 'second draft' },
      'user-1',
    );

    const revisions = await service.list(CmsEntityType.MEDIA_ASSET, 'entity-1');

    expect(revisions).toHaveLength(2);
    expect(revisions[0].snapshot).toEqual({ title: 'second draft' });
    expect(revisions[1].snapshot).toEqual({ title: 'first draft' });
  });

  it('rejects list() for an entity type outside the closed CmsEntityType set', async () => {
    const service = new RevisionsService(fakeRepository(), { emit: jest.fn() } as any);

    await expect(service.list('not_a_real_type', 'entity-1')).rejects.toThrow(BadRequestException);
  });

  it('restores a revision, emits REVISION_RESTORED, and returns the snapshot', async () => {
    const rows: ContentRevision[] = [];
    const repository = fakeRepository(rows);
    const events = { emit: jest.fn() } as any;
    const service = new RevisionsService(repository, events);

    const revision = await service.snapshot(
      CmsEntityType.MEDIA_ASSET,
      'entity-1',
      'site-1',
      { title: 'draft to restore' },
      'user-1',
    );

    const restored = await service.restore(
      CmsEntityType.MEDIA_ASSET,
      'entity-1',
      revision.id,
      'user-2',
    );

    expect(restored.snapshot).toEqual({ title: 'draft to restore' });
    expect(events.emit).toHaveBeenCalledWith(
      CMS_DOMAIN_EVENTS.REVISION_RESTORED,
      expect.objectContaining({
        entityType: CmsEntityType.MEDIA_ASSET,
        entityId: 'entity-1',
        siteId: 'site-1',
        revisionId: revision.id,
        performedBy: 'user-2',
      }),
    );
  });

  it('throws NotFoundException restoring a revision id that belongs to a different entity', async () => {
    const rows: ContentRevision[] = [];
    const repository = fakeRepository(rows);
    const service = new RevisionsService(repository, { emit: jest.fn() } as any);

    const revision = await service.snapshot(
      CmsEntityType.MEDIA_ASSET,
      'entity-1',
      'site-1',
      { title: 'belongs to entity-1' },
      'user-1',
    );

    await expect(
      service.restore(CmsEntityType.MEDIA_ASSET, 'entity-2', revision.id, 'user-2'),
    ).rejects.toThrow(NotFoundException);
  });
});
