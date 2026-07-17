import { Controller, Get, Query } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { PublicGalleryQueryDto } from './dto/gallery-item-query.dto';

/**
 * `cms/public/gallery` — CMS-H.1. Unguarded, uncached public read — same
 * stopgap every public controller since CMS-D uses (`?siteId=` query
 * param until CMS-I's Host-based guard/cache land). Optional
 * `?category=` narrows to a single admin-defined grouping.
 */
@Controller('cms/public/gallery')
export class GalleryPublicController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
  async findPublished(@Query() query: PublicGalleryQueryDto) {
    return this.galleryService.findPublished(query.siteId, query.locale, query.category);
  }
}
