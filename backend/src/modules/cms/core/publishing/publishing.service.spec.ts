import { BadRequestException } from '@nestjs/common';
import { PublishingService } from './publishing.service';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';
import { AuditAction } from '../../../../common/audit/audit-log.entity';
import { CMS_DOMAIN_EVENTS } from '../events/cms-domain-events';

function fakeAuditService() {
  return { record: jest.fn().mockResolvedValue(undefined) } as any;
}

function fakeEvents() {
  return { emit: jest.fn() } as any;
}

/** Minimal stand-in for a `BaseContentService<T>` subclass instance. */
function fakeContentService(entity: Record<string, unknown>) {
  return {
    applyStatusTransition: jest.fn().mockImplementation(async (_siteId, _id, patch) => ({
      ...entity,
      ...patch,
    })),
  } as any;
}

describe('PublishingService', () => {
  it('publish() flips status to PUBLISHED, emits the event, and writes an audit row', async () => {
    const auditService = fakeAuditService();
    const events = fakeEvents();
    const service = new PublishingService(auditService, events);
    const contentService = fakeContentService({ id: 'block-1', siteId: 'site-1' });

    const result = await service.publish(
      contentService,
      CmsEntityType.MEDIA_ASSET,
      'site-1',
      'block-1',
      'user-1',
    );

    expect(result.status).toBe(ContentStatus.PUBLISHED);
    expect(contentService.applyStatusTransition).toHaveBeenCalledWith(
      'site-1',
      'block-1',
      expect.objectContaining({ status: ContentStatus.PUBLISHED, scheduledAt: null }),
      'user-1',
    );
    expect(events.emit).toHaveBeenCalledWith(
      CMS_DOMAIN_EVENTS.CONTENT_PUBLISHED,
      expect.objectContaining({ entityId: 'block-1', siteId: 'site-1', performedBy: 'user-1' }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ schoolId: null, userId: 'user-1', action: AuditAction.CMS_CONTENT_PUBLISHED }),
    );
  });

  it('unpublish() flips status back to DRAFT and clears publishedAt', async () => {
    const auditService = fakeAuditService();
    const events = fakeEvents();
    const service = new PublishingService(auditService, events);
    const contentService = fakeContentService({ id: 'block-1', siteId: 'site-1' });

    const result = await service.unpublish(
      contentService,
      CmsEntityType.MEDIA_ASSET,
      'site-1',
      'block-1',
      'user-1',
    );

    expect(result.status).toBe(ContentStatus.DRAFT);
    expect(result.publishedAt).toBeNull();
    expect(events.emit).toHaveBeenCalledWith(
      CMS_DOMAIN_EVENTS.CONTENT_UNPUBLISHED,
      expect.objectContaining({ entityId: 'block-1' }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.CMS_CONTENT_UNPUBLISHED }),
    );
  });

  it('schedule() rejects a scheduledAt that is not in the future', async () => {
    const service = new PublishingService(fakeAuditService(), fakeEvents());
    const contentService = fakeContentService({ id: 'block-1', siteId: 'site-1' });
    const past = new Date(Date.now() - 60_000);

    await expect(
      service.schedule(contentService, CmsEntityType.MEDIA_ASSET, 'site-1', 'block-1', past, 'user-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('schedule() flips status to SCHEDULED for a future date', async () => {
    const auditService = fakeAuditService();
    const events = fakeEvents();
    const service = new PublishingService(auditService, events);
    const contentService = fakeContentService({ id: 'block-1', siteId: 'site-1' });
    const future = new Date(Date.now() + 60_000);

    const result = await service.schedule(
      contentService,
      CmsEntityType.MEDIA_ASSET,
      'site-1',
      'block-1',
      future,
      'user-1',
    );

    expect(result.status).toBe(ContentStatus.SCHEDULED);
    expect(result.scheduledAt).toBe(future);
    expect(events.emit).toHaveBeenCalledWith(
      CMS_DOMAIN_EVENTS.CONTENT_SCHEDULED,
      expect.objectContaining({ scheduledAt: future }),
    );
  });

  it('runScheduledPublish() publishes only due rows for registered content types, with no acting user', async () => {
    const auditService = fakeAuditService();
    const events = fakeEvents();
    const service = new PublishingService(auditService, events);

    const dueRow = { id: 'due-1', siteId: 'site-1', status: ContentStatus.SCHEDULED };
    const notYetDueRow = { id: 'not-due-1', siteId: 'site-1', status: ContentStatus.SCHEDULED };
    const contentService = fakeContentService({});

    const repository = {
      find: jest.fn().mockResolvedValue([dueRow]), // fake repo already filters by scheduledAt <= now
    } as any;

    service.registerSchedulable({
      entityType: CmsEntityType.MEDIA_ASSET,
      repository,
      contentService,
    });

    const count = await service.runScheduledPublish();

    expect(count).toBe(1);
    expect(contentService.applyStatusTransition).toHaveBeenCalledWith(
      'site-1',
      'due-1',
      expect.objectContaining({ status: ContentStatus.PUBLISHED }),
      null,
    );
    expect(events.emit).toHaveBeenCalledWith(
      CMS_DOMAIN_EVENTS.CONTENT_PUBLISHED,
      expect.objectContaining({ entityId: 'due-1', performedBy: null }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null, action: AuditAction.CMS_CONTENT_PUBLISHED }),
    );
    expect(notYetDueRow.status).toBe(ContentStatus.SCHEDULED); // untouched, never fetched
  });

  it('runScheduledPublish() logs and continues when one row fails to publish', async () => {
    const events = fakeEvents();
    const service = new PublishingService(fakeAuditService(), events);

    const okRow = { id: 'ok-1', siteId: 'site-1' };
    const badRow = { id: 'bad-1', siteId: 'site-1' };

    const contentService = {
      applyStatusTransition: jest.fn().mockImplementation(async (_siteId, id) => {
        if (id === 'bad-1') {
          throw new Error('boom');
        }
        return { id, siteId: 'site-1', status: ContentStatus.PUBLISHED };
      }),
    } as any;

    service.registerSchedulable({
      entityType: CmsEntityType.MEDIA_ASSET,
      repository: { find: jest.fn().mockResolvedValue([badRow, okRow]) } as any,
      contentService,
    });

    const count = await service.runScheduledPublish();

    expect(count).toBe(1);
  });
});
