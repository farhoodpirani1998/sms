import { Controller, Get, Query } from '@nestjs/common';
import { AboutService } from './about.service';
import { PublicAboutQueryDto } from './dto/about-query.dto';

/**
 * `cms/public/about` — CMS-D.2. Unguarded, uncached public read — same
 * stopgap `HeroPublicController` (CMS-D.1) uses (`?siteId=` query param
 * until CMS-I's Host-based guard/cache land).
 */
@Controller('cms/public/about')
export class AboutPublicController {
  constructor(private readonly aboutService: AboutService) {}

  @Get()
  async findPublished(@Query() query: PublicAboutQueryDto) {
    return this.aboutService.findPublished(query.siteId, query.locale);
  }
}
