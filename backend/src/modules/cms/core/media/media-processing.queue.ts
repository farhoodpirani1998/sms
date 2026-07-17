import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

/**
 * `MediaProcessingQueue` — CMS-B.5 (marked deferred/optional in the
 * roadmap: "can slip to a later phase"; shipped anyway — see the
 * CMS handoff report, docs/reports/CMS_HANDOFF_FINAL_CHECKS.md §2).
 * Async thumbnailing for uploaded images,
 * on the same BullMQ connection `NotificationsModule` already registers
 * against (see `BullModule.forRoot` in `app.module.ts` — a single Redis
 * connection shared by every queue in the app; this sub-phase only adds
 * a second named queue on top of it, no new connection config).
 *
 * Thin wrapper around the queue, mirroring `NotificationsService`'s own
 * `@InjectQueue` usage — `MediaService.upload()` (CMS-B.4) is the only
 * caller, enqueuing one job per successfully-stored image so thumbnail
 * generation never blocks the upload response.
 */
export const MEDIA_PROCESSING_QUEUE = 'media-processing';

export interface ThumbnailJobData {
  mediaAssetId: string;
}

@Injectable()
export class MediaProcessingQueue {
  constructor(
    @InjectQueue(MEDIA_PROCESSING_QUEUE)
    private readonly queue: Queue<ThumbnailJobData>,
  ) {}

  /**
   * Enqueues thumbnail generation for a just-uploaded `MediaAsset`.
   * Retries per `NotificationsService`'s existing convention (3 attempts,
   * exponential backoff) since a transient storage-read/write failure
   * shouldn't permanently leave an image without a thumbnail.
   */
  async enqueueThumbnailJob(mediaAssetId: string): Promise<void> {
    await this.queue.add(
      'generate-thumbnail',
      { mediaAssetId },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
  }
}
