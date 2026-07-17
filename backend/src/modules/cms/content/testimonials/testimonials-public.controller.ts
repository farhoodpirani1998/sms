import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { PublicTestimonialQueryDto } from './dto/testimonial-query.dto';
import { PublicSiteContextGuard } from '../../core/public-api/guards/public-site-context.guard';
import { PublicCacheInterceptor } from '../../core/public-api/interceptors/public-cache.interceptor';
import { PublicSiteContext } from '../../common/decorators/public-site-context.decorator';
import { Site } from '../../core/site/entities/site.entity';

/**
 * `public/testimonials` — CMS-H, wired for CMS-I.5. Site-scoped via
 * `PublicSiteContextGuard` (Host-header resolution, replacing the old
 * `?siteId=` query param) and cached by `PublicCacheInterceptor`, same
 * pairing every prior CMS-D/E/F/G public controller got in
 * CMS-I.3/I.4.
 */
@Controller('public/testimonials')
@UseGuards(PublicSiteContextGuard)
@UseInterceptors(PublicCacheInterceptor)
export class TestimonialsPublicController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get()
  async findPublished(@PublicSiteContext() site: Site, @Query() query: PublicTestimonialQueryDto) {
    return this.testimonialsService.findPublished(site.id, query.locale);
  }
}
