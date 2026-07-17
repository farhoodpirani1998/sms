import { CacheInvalidationListener } from './cache-invalidation.listener';
import { CmsEntityType } from '../../../common/enums/cms-entity-type.enum';
import {
  ContentPublishedEvent,
  ContentUnpublishedEvent,
  ContentUpdatedEvent,
} from '../../events/cms-domain-events';

function fakeRedis(scanPages: Array<[string, string[]]>) {
  const scan = jest.fn();
  scanPages.forEach((page) => scan.mockImplementationOnce(async () => page));
  return {
    scan,
    del: jest.fn().mockImplementation(async (...keys: string[]) => keys.length),
  } as any;
}

describe('CacheInvalidationListener', () => {
  it('deletes every key matched in a single SCAN page', async () => {
    const redis = fakeRedis([['0', ['cms:public:site-1:en:/api/public/hero']]]);
    const listener = new CacheInvalidationListener(redis);

    const deleted = await listener.invalidateSite('site-1');

    expect(redis.scan).toHaveBeenCalledWith('0', 'MATCH', 'cms:public:site-1:*', 'COUNT', 100);
    expect(redis.del).toHaveBeenCalledWith('cms:public:site-1:en:/api/public/hero');
    expect(deleted).toBe(1);
  });

  it('follows the cursor across multiple SCAN pages until it returns to "0"', async () => {
    const redis = fakeRedis([
      ['17', ['cms:public:site-1:en:/api/public/hero']],
      ['0', ['cms:public:site-1:fa:/api/public/hero']],
    ]);
    const listener = new CacheInvalidationListener(redis);

    const deleted = await listener.invalidateSite('site-1');

    expect(redis.scan).toHaveBeenCalledTimes(2);
    expect(redis.scan).toHaveBeenNthCalledWith(1, '0', 'MATCH', 'cms:public:site-1:*', 'COUNT', 100);
    expect(redis.scan).toHaveBeenNthCalledWith(2, '17', 'MATCH', 'cms:public:site-1:*', 'COUNT', 100);
    expect(deleted).toBe(2);
  });

  it('does not call del when a SCAN page has no matches', async () => {
    const redis = fakeRedis([['0', []]]);
    const listener = new CacheInvalidationListener(redis);

    const deleted = await listener.invalidateSite('site-1');

    expect(redis.del).not.toHaveBeenCalled();
    expect(deleted).toBe(0);
  });

  it('swallows a Redis failure and returns 0 rather than throwing', async () => {
    const redis = { scan: jest.fn().mockRejectedValue(new Error('down')), del: jest.fn() } as any;
    const listener = new CacheInvalidationListener(redis);

    await expect(listener.invalidateSite('site-1')).resolves.toBe(0);
    expect(redis.del).not.toHaveBeenCalled();
  });

  describe('event handlers', () => {
    it('invalidates the event Site on CONTENT_PUBLISHED', async () => {
      const redis = fakeRedis([['0', []]]);
      const listener = new CacheInvalidationListener(redis);
      const spy = jest.spyOn(listener, 'invalidateSite');

      await listener.onContentPublished(
        new ContentPublishedEvent(CmsEntityType.MEDIA_ASSET, 'entity-1', 'site-1', 'user-1', new Date()),
      );

      expect(spy).toHaveBeenCalledWith('site-1');
    });

    it('invalidates the event Site on CONTENT_UNPUBLISHED', async () => {
      const redis = fakeRedis([['0', []]]);
      const listener = new CacheInvalidationListener(redis);
      const spy = jest.spyOn(listener, 'invalidateSite');

      await listener.onContentUnpublished(
        new ContentUnpublishedEvent(CmsEntityType.MEDIA_ASSET, 'entity-1', 'site-1', 'user-1'),
      );

      expect(spy).toHaveBeenCalledWith('site-1');
    });

    it('invalidates the event Site on CONTENT_UPDATED', async () => {
      const redis = fakeRedis([['0', []]]);
      const listener = new CacheInvalidationListener(redis);
      const spy = jest.spyOn(listener, 'invalidateSite');

      await listener.onContentUpdated(
        new ContentUpdatedEvent(CmsEntityType.MEDIA_ASSET, 'entity-1', 'site-1', 'user-1'),
      );

      expect(spy).toHaveBeenCalledWith('site-1');
    });
  });
});
