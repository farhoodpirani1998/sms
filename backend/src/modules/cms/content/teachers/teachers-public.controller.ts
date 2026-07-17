import { Controller, Get, Query } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { PublicTeacherProfileQueryDto } from './dto/teacher-profile-query.dto';

/**
 * `cms/public/teachers` — CMS-H.3. Unguarded, uncached public read —
 * same stopgap every public controller since CMS-D uses (`?siteId=`
 * query param until CMS-I's Host-based guard/cache land).
 */
@Controller('cms/public/teachers')
export class TeachersPublicController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  async findPublished(@Query() query: PublicTeacherProfileQueryDto) {
    return this.teachersService.findPublished(query.siteId, query.locale);
  }
}
