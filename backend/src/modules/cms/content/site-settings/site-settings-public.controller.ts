import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service';
import { PublicSiteSettingsQueryDto } from './dto/update-site-settings.dto';
import { PublicSiteContextGuard } from '../../core/public-api/guards/public-site-context.guard';
import { PublicCacheInterceptor } from '../../core/public-api/interceptors/public-cache.interceptor';
import { PublicSiteContext } from '../../common/decorators/public-site-context.decorator';
import { Site } from '../../core/site/entities/site.entity';

/**
 * `public/site-settings` — CMS-E.1, wired for CMS-I.4. Site-scoped
 * via `PublicSiteContextGuard` (Host-header resolution, replacing the
 * old `?siteId=` query param) and cached by `PublicCacheInterceptor`,
 * same pairing every CMS-D public controller got in CMS-I.3. Unlike the
 * admin controller's `GET`, this never lazily creates a row — a Site
 * with no published settings yet just returns `null` (see
 * `SiteSettingsService.findPublished()`'s doc comment).
 */
@Controller('public/site-settings')
@UseGuards(PublicSiteContextGuard)
@UseInterceptors(PublicCacheInterceptor)
export class SiteSettingsPublicController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get()
  async findPublished(@PublicSiteContext() site: Site, @Query() query: PublicSiteSettingsQueryDto) {
    return this.siteSettingsService.findPublished(site.id, query.locale);
  }
}
