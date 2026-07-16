import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { MediaAsset } from './entities/media-asset.entity';
import { STORAGE_PROVIDER } from './storage/storage-provider.interface';
import { storageProviderFactory } from './storage/storage-provider.factory';

/**
 * CMS-B.1 registered `MediaAsset` with TypeORM. CMS-B.2 hardcoded
 * `STORAGE_PROVIDER` to `LocalDiskStorageProvider`. CMS-B.3 replaces that
 * with `storageProviderFactory`, so the driver is selected by
 * `MEDIA_STORAGE_DRIVER` with no change needed here or in any future
 * consumer that injects `STORAGE_PROVIDER` — swapping `local`/`s3` is
 * purely an env var change (docs/architecture/CMS_ARCHITECTURE.md §4.7).
 * No controllers/services yet — those land in CMS-B.4.
 */
@Module({
  imports: [TypeOrmModule.forFeature([MediaAsset])],
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useFactory: storageProviderFactory,
      inject: [ConfigService],
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class MediaModule {}
