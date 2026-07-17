import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import {
  CMS_DOMAIN_EVENTS,
  ContentPublishedEvent,
  ContentUnpublishedEvent,
  ContentUpdatedEvent,
} from '../../events/cms-domain-events';
import { PUBLIC_CACHE_REDIS, buildPublicCacheSitePattern } from '../interceptors/public-cache.interceptor';

/**
 * CMS-I.2. Subscribes to the three events the roadmap names
 * (`CONTENT_PUBLISHED`/`CONTENT_UNPUBLISHED`/`CONTENT_UPDATED` — all
 * defined in CMS-C.1's `cms-domain-events.ts`, emitted since CMS-C.3/C.4)
 * and clears every `PublicCacheInterceptor` key for the affected Site.
 *
 * Deliberately clears the whole Site's cache rather than one exact key:
 * this listener only receives `entityType`/`entityId`/`siteId`, not which
 * public route(s) or locale(s) that entity is actually rendered under —
 * computing that mapping isn't worth it when a Site-wide `SCAN`+`DEL` is
 * already cheap (the cache itself is scoped to short-TTL public reads,
 * not a large dataset).
 */
@Injectable()
export class CacheInvalidationListener {
  private readonly logger = new Logger(CacheInvalidationListener.name);

  constructor(@Inject(PUBLIC_CACHE_REDIS) private readonly redis: Redis) {}

  @OnEvent(CMS_DOMAIN_EVENTS.CONTENT_PUBLISHED)
  async onContentPublished(event: ContentPublishedEvent): Promise<void> {
    await this.invalidateSite(event.siteId);
  }

  @OnEvent(CMS_DOMAIN_EVENTS.CONTENT_UNPUBLISHED)
  async onContentUnpublished(event: ContentUnpublishedEvent): Promise<void> {
    await this.invalidateSite(event.siteId);
  }

  @OnEvent(CMS_DOMAIN_EVENTS.CONTENT_UPDATED)
  async onContentUpdated(event: ContentUpdatedEvent): Promise<void> {
    await this.invalidateSite(event.siteId);
  }

  /**
   * Walks `cms:public:{siteId}:*` via `SCAN` (never `KEYS` — this must
   * not block Redis while a public site is being read concurrently) and
   * deletes every match. Returns the number of keys removed. A Redis
   * failure is logged and swallowed — a stale cache entry expiring on
   * its own TTL is an acceptable outcome; a failed invalidation must
   * never surface as a failed publish/unpublish/update.
   */
  async invalidateSite(siteId: string): Promise<number> {
    const pattern = buildPublicCacheSitePattern(siteId);
    let cursor = '0';
    let deleted = 0;

    try {
      do {
        const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          deleted += await this.redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      this.logger.warn(
        `Public cache invalidation failed for site "${siteId}": ${(error as Error).message}`,
      );
    }

    return deleted;
  }
}
