import { Controller, Get, Query } from '@nestjs/common';
import { CampusesService } from './campuses.service';
import { PublicCampusQueryDto } from './dto/campus-query.dto';

/**
 * `cms/public/campuses` — CMS-H.4. Unguarded, uncached public read —
 * same stopgap every public controller since CMS-D uses (`?siteId=`
 * query param until CMS-I's Host-based guard/cache land).
 */
@Controller('cms/public/campuses')
export class CampusesPublicController {
  constructor(private readonly campusesService: CampusesService) {}

  @Get()
  async findPublished(@Query() query: PublicCampusQueryDto) {
    return this.campusesService.findPublished(query.siteId, query.locale);
  }
}
