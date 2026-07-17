import { Controller, Get, Query } from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { PublicTestimonialQueryDto } from './dto/testimonial-query.dto';

/**
 * `cms/public/testimonials` — CMS-H.2. Unguarded, uncached public read —
 * same stopgap every public controller since CMS-D uses (`?siteId=`
 * query param until CMS-I's Host-based guard/cache land).
 */
@Controller('cms/public/testimonials')
export class TestimonialsPublicController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get()
  async findPublished(@Query() query: PublicTestimonialQueryDto) {
    return this.testimonialsService.findPublished(query.siteId, query.locale);
  }
}
