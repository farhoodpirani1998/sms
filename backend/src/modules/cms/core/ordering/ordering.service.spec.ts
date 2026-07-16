import { BadRequestException } from '@nestjs/common';
import { OrderingService } from './ordering.service';
import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';
import { CMS_DOMAIN_EVENTS } from '../events/cms-domain-events';

function fakeDataSourceAndRepository(rows: Array<{ id: string; siteId: string; sortOrder: number }>) {
  const txRepository = {
    find: jest.fn().mockImplementation(async ({ where }: any) =>
      rows.filter((r) => r.siteId === where.siteId),
    ),
    update: jest.fn().mockImplementation(async (criteria: any, patch: any) => {
      const row = rows.find((r) => r.id === criteria.id && r.siteId === criteria.siteId);
      if (row) {
        Object.assign(row, patch);
      }
      return { affected: row ? 1 : 0 } as any;
    }),
  };

  const manager = {
    withRepository: jest.fn().mockReturnValue(txRepository),
  };

  const dataSource = {
    transaction: jest.fn().mockImplementation(async (cb: any) => cb(manager)),
  };

  return { dataSource, txRepository, manager };
}

describe('OrderingService', () => {
  it('reorders rows transactionally and emits CONTENT_REORDERED', async () => {
    const rows = [
      { id: 'a', siteId: 'site-1', sortOrder: 0 },
      { id: 'b', siteId: 'site-1', sortOrder: 1 },
      { id: 'c', siteId: 'site-1', sortOrder: 2 },
    ];
    const { dataSource } = fakeDataSourceAndRepository(rows);
    const events = { emit: jest.fn() } as any;
    const service = new OrderingService(dataSource as any, events);

    await service.reorder({} as any, CmsEntityType.MEDIA_ASSET, 'site-1', ['c', 'a', 'b'], 'user-1');

    expect(rows.find((r) => r.id === 'c')!.sortOrder).toBe(0);
    expect(rows.find((r) => r.id === 'a')!.sortOrder).toBe(1);
    expect(rows.find((r) => r.id === 'b')!.sortOrder).toBe(2);
    expect(events.emit).toHaveBeenCalledWith(
      CMS_DOMAIN_EVENTS.CONTENT_REORDERED,
      expect.objectContaining({
        entityType: CmsEntityType.MEDIA_ASSET,
        siteId: 'site-1',
        orderedIds: ['c', 'a', 'b'],
        performedBy: 'user-1',
      }),
    );
  });

  it('rejects duplicate ids without starting a transaction', async () => {
    const { dataSource } = fakeDataSourceAndRepository([]);
    const service = new OrderingService(dataSource as any, { emit: jest.fn() } as any);

    await expect(
      service.reorder({} as any, CmsEntityType.MEDIA_ASSET, 'site-1', ['a', 'a'], 'user-1'),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects when an id does not belong to the given Site, rolling back the transaction', async () => {
    const rows = [{ id: 'a', siteId: 'site-1', sortOrder: 0 }];
    const { dataSource } = fakeDataSourceAndRepository(rows);
    const events = { emit: jest.fn() } as any;
    const service = new OrderingService(dataSource as any, events);

    await expect(
      service.reorder({} as any, CmsEntityType.MEDIA_ASSET, 'site-1', ['a', 'missing'], 'user-1'),
    ).rejects.toThrow(BadRequestException);
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('is a no-op for an empty orderedIds list', async () => {
    const { dataSource } = fakeDataSourceAndRepository([]);
    const events = { emit: jest.fn() } as any;
    const service = new OrderingService(dataSource as any, events);

    await service.reorder({} as any, CmsEntityType.MEDIA_ASSET, 'site-1', [], 'user-1');

    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(events.emit).not.toHaveBeenCalled();
  });
});
