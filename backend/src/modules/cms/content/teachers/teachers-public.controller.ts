import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { PublicTeacherProfileQueryDto } from './dto/teacher-profile-query.dto';
import { PublicSiteContextGuard } from '../../core/public-api/guards/public-site-context.guard';
import { PublicCacheInterceptor } from '../../core/public-api/interceptors/public-cache.interceptor';
import { PublicSiteContext } from '../../common/decorators/public-site-context.decorator';
import { Site } from '../../core/site/entities/site.entity';

/**
 * `public/teachers` — CMS-H, wired for CMS-I.5. Site-scoped via
 * `PublicSiteContextGuard` (Host-header resolution, replacing the old
 * `?siteId=` query param) and cached by `PublicCacheInterceptor`, same
 * pairing every prior CMS-D/E/F/G public controller got in
 * CMS-I.3/I.4.
 */
@Controller('public/teachers')
@UseGuards(PublicSiteContextGuard)
@UseInterceptors(PublicCacheInterceptor)
export class TeachersPublicController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  async findPublished(@PublicSiteContext() site: Site, @Query() query: PublicTeacherProfileQueryDto) {
    return this.teachersService.findPublished(site.id, query.locale);
  }
}
