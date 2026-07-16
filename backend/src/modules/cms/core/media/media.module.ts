import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaAsset } from './entities/media-asset.entity';

/**
 * CMS-B.1 — module skeleton only. Registers `MediaAsset` with TypeORM so
 * the table/entity are wired end-to-end (proven by the app booting with
 * this module imported), but declares no controllers or providers yet —
 * `StorageProvider` lands in CMS-B.2/B.3, the service/controller in
 * CMS-B.4.
 */
@Module({
  imports: [TypeOrmModule.forFeature([MediaAsset])],
})
export class MediaModule {}
