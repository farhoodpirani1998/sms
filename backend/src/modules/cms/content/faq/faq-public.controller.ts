import { Controller, Get, Query } from '@nestjs/common';
import { FaqService } from './faq.service';
import { PublicFaqQueryDto } from './dto/faq-query.dto';

/**
 * `cms/public/faq` — CMS-D.6. Unguarded, uncached public read — same
 * stopgap every prior CMS-D public controller uses (`?siteId=` query
 * param until CMS-I's Host-based guard/cache land).
 */
@Controller('cms/public/faq')
export class FaqPublicController {
  constructor(private readonly faqService: FaqService) {}

  @Get()
  async findPublished(@Query() query: PublicFaqQueryDto) {
    return this.faqService.findPublished(query.siteId, query.locale);
  }
}
