import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { MediaAsset } from './entities/media-asset.entity';
import { STORAGE_PROVIDER, StorageProvider } from './storage/storage-provider.interface';
import { SiteService } from '../site/site.service';
import { UploadMediaDto } from './dto/upload-media.dto';

/**
 * `MediaService` — CMS-B.4. The only caller of `StorageProvider.write()`
 * in the whole module so far; every future content type that needs a
 * fresh upload (as opposed to just referencing an existing
 * `coverMediaId`) goes through this same path.
 */
@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(MediaAsset)
    private readonly mediaAssetRepository: Repository<MediaAsset>,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,
    private readonly siteService: SiteService,
  ) {}

  /**
   * Persists an uploaded file's bytes via the active `StorageProvider`
   * and records a `MediaAsset` row pointing at it.
   *
   * Order matters: the Site is confirmed to exist (`SiteService.findOne`
   * — throws `NotFoundException` for a bad id, same 404 shape as every
   * other Site-id lookup in the module) *before* anything is written to
   * storage, so a bad `siteId` never leaves an orphaned file behind with
   * no DB row pointing at it.
   *
   * `storageKey` is namespaced `sites/{siteId}/{uuid}{ext}` per
   * docs/architecture/CMS_ARCHITECTURE.md §4.7 — composed here, not by
   * the `StorageProvider`, matching the division of responsibility both
   * `LocalDiskStorageProvider` and `S3StorageProvider` were written
   * against (see their doc comments). A fresh random name (not the
   * client's `originalFilename`) avoids collisions and path-injection
   * from a hostile filename; the original name is preserved separately
   * on the row for display purposes only.
   *
   * `width`/`height` are left `null` — no image-dimension probing lands
   * until thumbnailing (CMS-B.5, deferred/optional per the roadmap).
   */
  async upload(
    file: Express.Multer.File | undefined,
    dto: UploadMediaDto,
    uploadedById: string,
  ): Promise<MediaAsset> {
    if (!file) {
      throw new BadRequestException('فایلی برای آپلود ارسال نشده است');
    }

    await this.siteService.findOne(dto.siteId);

    const extension = path.extname(file.originalname);
    const key = `sites/${dto.siteId}/${randomUUID()}${extension}`;
    const stored = await this.storageProvider.write(key, file.buffer);

    const asset = this.mediaAssetRepository.create({
      siteId: dto.siteId,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: stored.sizeBytes,
      storageKey: stored.storageKey,
      url: stored.url,
      width: null,
      height: null,
      altText: dto.altText ?? null,
      uploadedById,
    });

    return this.mediaAssetRepository.save(asset);
  }
}
