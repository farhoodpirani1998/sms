import { Controller, Get, Query } from '@nestjs/common';
import { CtaService } from './cta.service';
import { PublicCtaQueryDto } from './dto/cta-query.dto';

/**
 * `cms/public/cta` — CMS-D.3. Unguarded, uncached public read — same
 * stopgap `HeroPublicController` (CMS-D.1)/`AboutPublicController`
 * (CMS-D.2) use (`?siteId=` query param until CMS-I's Host-based
 * guard/cache land).
 */
@Controller('cms/public/cta')
export class CtaPublicController {
  constructor(private readonly ctaService: CtaService) {}

  @Get()
  async findPublished(@Query() query: PublicCtaQueryDto) {
    return this.ctaService.findPublished(query.siteId, query.locale);
  }
}
