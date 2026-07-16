import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import sharp from 'sharp';
import { MediaAsset } from './entities/media-asset.entity';
import { STORAGE_PROVIDER, StorageProvider } from './storage/storage-provider.interface';
import { MEDIA_PROCESSING_QUEUE, ThumbnailJobData } from './media-processing.queue';

// Longest edge of the generated thumbnail. Aspect ratio is preserved
// (`fit: 'inside'`), so this is a cap, not a fixed size.
const THUMBNAIL_MAX_DIMENSION = 400;

/**
 * `MediaProcessingProcessor` — CMS-B.5. Consumes jobs enqueued by
 * `MediaProcessingQueue` (`MediaService.upload()`, CMS-B.4) to generate
 * an async thumbnail for images, following the same
 * `@Processor`/`WorkerHost` shape as `NotificationsProcessor`.
 *
 * Reads the original back through the existing `StorageProvider`
 * abstraction (so it works unmodified against either `local` or `s3`,
 * per CMS-B.2/B.3 — this processor never talks to disk or S3 directly)
 * and writes the resized thumbnail back through the same provider under
 * a derived key: `{dir}/{basename}-thumb{ext}` alongside the original.
 * That convention (rather than a new DB column for a "thumbnail URL")
 * keeps this sub-phase's file list to just the queue/processor/module
 * wiring — a caller who wants the thumbnail can derive its key from the
 * `MediaAsset.storageKey` it already has. `width`/`height` (present on
 * `MediaAsset` since CMS-B.1, left `null` by CMS-B.4) are backfilled
 * here with the *original* image's real dimensions, read via
 * `sharp(...).metadata()`.
 *
 * Non-image assets (mimeType not `image/*`) are skipped — nothing should
 * enqueue a job for those (see `MediaService.upload()`), but the guard
 * stays here too in case a job is ever retried after the row's mimeType
 * somehow no longer matches, or the queue is driven manually.
 */
@Processor(MEDIA_PROCESSING_QUEUE)
@Injectable()
export class MediaProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(MediaProcessingProcessor.name);

  constructor(
    @InjectRepository(MediaAsset)
    private readonly mediaAssetRepository: Repository<MediaAsset>,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,
  ) {
    super();
  }

  async process(job: Job<ThumbnailJobData>): Promise<void> {
    const asset = await this.mediaAssetRepository.findOne({
      where: { id: job.data.mediaAssetId },
    });

    if (!asset) {
      this.logger.warn(
        `MediaAsset ${job.data.mediaAssetId} not found, skipping thumbnail job`,
      );
      return;
    }

    if (!asset.mimeType.startsWith('image/')) {
      this.logger.debug(
        `MediaAsset ${asset.id} is not an image (${asset.mimeType}), skipping thumbnail job`,
      );
      return;
    }

    const original = await this.storageProvider.read(asset.storageKey);
    const image = sharp(original);
    const metadata = await image.metadata();

    const thumbnailBuffer = await image
      .resize(THUMBNAIL_MAX_DIMENSION, THUMBNAIL_MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer();

    await this.storageProvider.write(this.thumbnailKey(asset.storageKey), thumbnailBuffer);

    asset.width = metadata.width ?? null;
    asset.height = metadata.height ?? null;
    await this.mediaAssetRepository.save(asset);
  }

  // Derives 'sites/{siteId}/{uuid}-thumb.ext' from 'sites/{siteId}/{uuid}.ext'
  // using POSIX joins — storageKeys are always forward-slash paths (see
  // LocalDiskStorageProvider/S3StorageProvider), regardless of the host OS.
  private thumbnailKey(storageKey: string): string {
    const extension = path.posix.extname(storageKey);
    const dir = path.posix.dirname(storageKey);
    const base = path.posix.basename(storageKey, extension);
    return path.posix.join(dir, `${base}-thumb${extension}`);
  }
}
