import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GalleryItem } from './entities/gallery-item.entity';
import { GalleryService } from './gallery.service';
import { GalleryController } from './gallery.controller';
import { GalleryPublicController } from './gallery-public.controller';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { SiteModule } from '../../core/site/site.module';
import { RevisionsModule } from '../../core/revisions/revisions.module';
import { PublishingModule } from '../../core/publishing/publishing.module';
import { OrderingModule } from '../../core/ordering/ordering.module';

/**
 * `GalleryModule` — CMS-H.1. Same cross-cutting imports every content
 * module needs (`RevisionsModule`, `PublishingModule`, `OrderingModule`,
 * `SiteModule` for `LocaleResolverService`). Not exported — nothing
 * outside this module needs `GalleryService`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([GalleryItem]),
    SiteModule,
    RevisionsModule,
    PublishingModule,
    OrderingModule,
  ],
  controllers: [GalleryController, GalleryPublicController],
  providers: [GalleryService, LocaleResolverService],
})
export class GalleryModule {}
