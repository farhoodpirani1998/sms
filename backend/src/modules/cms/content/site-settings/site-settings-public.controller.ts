import { Controller, Get, Query } from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service';
import { PublicSiteSettingsQueryDto } from './dto/update-site-settings.dto';

/**
 * `cms/public/site-settings` — CMS-E.1. Unguarded, uncached public read
 * — same stopgap every CMS-D public controller uses (`?siteId=` query
 * param until CMS-I's Host-based guard/cache land). Unlike the admin
 * controller's `GET`, this never lazily creates a row — a Site with no
 * published settings yet just returns `null` (see
 * `SiteSettingsService.findPublished()`'s doc comment).
 */
@Controller('cms/public/site-settings')
export class SiteSettingsPublicController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get()
  async findPublished(@Query() query: PublicSiteSettingsQueryDto) {
    return this.siteSettingsService.findPublished(query.siteId, query.locale);
  }
}
