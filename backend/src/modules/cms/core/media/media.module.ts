import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaAsset } from './entities/media-asset.entity';
import { STORAGE_PROVIDER } from './storage/storage-provider.interface';
import { LocalDiskStorageProvider } from './storage/local-disk-storage.provider';

/**
 * CMS-B.1 registered `MediaAsset` with TypeORM. CMS-B.2 adds this
 * sub-phase's `StorageProvider` provider: hardcoded to
 * `LocalDiskStorageProvider` for now (driver-selection logic, and the
 * `S3StorageProvider` alternative, land in CMS-B.3's factory — this
 * module will swap the `useClass` below for a `useFactory` then, with no
 * change needed by any future consumer that injects `STORAGE_PROVIDER`).
 * No controllers/services yet — those land in CMS-B.4.
 */
@Module({
  imports: [TypeOrmModule.forFeature([MediaAsset])],
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useClass: LocalDiskStorageProvider,
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class MediaModule {}
