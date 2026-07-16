import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FeaturesService } from './features.service';
import { CreateFeatureDto, UpdateFeatureDto } from './dto/upsert-feature.dto';
import {
  FeatureListQueryDto,
  ReorderFeatureDto,
  ScheduleFeatureDto,
  SiteIdQueryDto,
} from './dto/feature-query.dto';
import { RestoreRevisionDto } from '../../core/revisions/dto/restore-revision.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { PermissionsGuard } from '../../../../common/authorization/permissions.guard';
import { RequirePermission } from '../../../../common/authorization/require-permission.decorator';
import { Permission } from '../../../../common/authorization/permissions';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';

/**
 * `cms/features` — CMS-D.5. Copies `HeroController` (CMS-D.1)/
 * `AboutController` (CMS-D.2)/`CtaController` (CMS-D.3)/
 * `StatisticsController` (CMS-D.4) 1:1, swapping `Feature`/`features` in.
 * Same guard/permission composition; revision list/restore go through
 * the shared generic `GET/POST /cms/features/:id/revisions...` routes.
 */
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('school_admin', 'staff')
@RequirePermission(Permission.CMS_CONTENT_EDIT)
@Controller('cms/features')
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  @Post()
  async create(@Body() dto: CreateFeatureDto, @CurrentUser() user: AuthenticatedUser) {
    const { siteId, ...data } = dto;
    return this.featuresService.create(siteId, data, user.id);
  }

  @Get()
  async findAll(@Query() query: FeatureListQueryDto) {
    return this.featuresService.findAll(query.siteId, {
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query() query: SiteIdQueryDto) {
    return this.featuresService.findOne(query.siteId, id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @Body() dto: UpdateFeatureDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.featuresService.update(query.siteId, id, dto, user.id);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.featuresService.remove(query.siteId, id, user.id);
    return { success: true };
  }

  @Post(':id/publish')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async publish(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.featuresService.publish(query.siteId, id, user.id);
  }

  @Post(':id/unpublish')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async unpublish(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.featuresService.unpublish(query.siteId, id, user.id);
  }

  @Post(':id/schedule')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async schedule(
    @Param('id') id: string,
    @Body() dto: ScheduleFeatureDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.featuresService.schedule(dto.siteId, id, new Date(dto.scheduledAt), user.id);
  }

  @Post(':id/restore')
  async restore(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @Body() dto: RestoreRevisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.featuresService.restore(query.siteId, id, dto.revisionId, user.id);
  }

  @Post('reorder')
  async reorder(@Body() dto: ReorderFeatureDto, @CurrentUser() user: AuthenticatedUser) {
    await this.featuresService.reorder(dto.siteId, dto.orderedIds, user.id);
    return { success: true };
  }
}
