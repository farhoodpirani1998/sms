import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { MediaAsset } from './entities/media-asset.entity';
import { STORAGE_PROVIDER } from './storage/storage-provider.interface';
import { storageProviderFactory } from './storage/storage-provider.factory';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { SiteModule } from '../site/site.module';

/**
 * CMS-B.1 registered `MediaAsset` with TypeORM. CMS-B.2 hardcoded
 * `STORAGE_PROVIDER` to `LocalDiskStorageProvider`. CMS-B.3 replaces that
 * with `storageProviderFactory`, so the driver is selected by
 * `MEDIA_STORAGE_DRIVER` with no change needed here or in any future
 * consumer that injects `STORAGE_PROVIDER` — swapping `local`/`s3` is
 * purely an env var change (docs/architecture/CMS_ARCHITECTURE.md §4.7).
 *
 * CMS-B.4 adds `MediaController`/`MediaService` (the upload endpoint) and
 * imports `SiteModule` — `MediaService` needs `SiteService.findOne()` to
 * confirm a `siteId` exists before writing anything to storage, the same
 * "import SiteModule for its exported SiteService rather than
 * re-declaring a Site repository" shape later content modules will reuse
 * (see `SiteModule`'s own doc comment).
 */
@Module({
  imports: [TypeOrmModule.forFeature([MediaAsset]), SiteModule],
  controllers: [MediaController],
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useFactory: storageProviderFactory,
      inject: [ConfigService],
    },
    MediaService,
  ],
  exports: [STORAGE_PROVIDER, MediaService],
})
export class MediaModule {}
