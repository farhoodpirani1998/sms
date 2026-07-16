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
import { StatisticsService } from './statistics.service';
import { CreateStatisticDto, UpdateStatisticDto } from './dto/upsert-statistic.dto';
import {
  ReorderStatisticDto,
  ScheduleStatisticDto,
  SiteIdQueryDto,
  StatisticListQueryDto,
} from './dto/statistic-query.dto';
import { RestoreRevisionDto } from '../../core/revisions/dto/restore-revision.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { PermissionsGuard } from '../../../../common/authorization/permissions.guard';
import { RequirePermission } from '../../../../common/authorization/require-permission.decorator';
import { Permission } from '../../../../common/authorization/permissions';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';

/**
 * `cms/statistics` — CMS-D.4. Copies `HeroController` (CMS-D.1)/
 * `AboutController` (CMS-D.2)/`CtaController` (CMS-D.3) 1:1, swapping
 * `Statistic`/`statistics` in. Same guard/permission composition;
 * revision list/restore go through the shared generic
 * `GET/POST /cms/statistics/:id/revisions...` routes.
 */
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('school_admin', 'staff')
@RequirePermission(Permission.CMS_CONTENT_EDIT)
@Controller('cms/statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Post()
  async create(@Body() dto: CreateStatisticDto, @CurrentUser() user: AuthenticatedUser) {
    const { siteId, ...data } = dto;
    return this.statisticsService.create(siteId, data, user.id);
  }

  @Get()
  async findAll(@Query() query: StatisticListQueryDto) {
    return this.statisticsService.findAll(query.siteId, {
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query() query: SiteIdQueryDto) {
    return this.statisticsService.findOne(query.siteId, id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @Body() dto: UpdateStatisticDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.statisticsService.update(query.siteId, id, dto, user.id);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.statisticsService.remove(query.siteId, id, user.id);
    return { success: true };
  }

  @Post(':id/publish')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async publish(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.statisticsService.publish(query.siteId, id, user.id);
  }

  @Post(':id/unpublish')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async unpublish(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.statisticsService.unpublish(query.siteId, id, user.id);
  }

  @Post(':id/schedule')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async schedule(
    @Param('id') id: string,
    @Body() dto: ScheduleStatisticDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.statisticsService.schedule(dto.siteId, id, new Date(dto.scheduledAt), user.id);
  }

  @Post(':id/restore')
  async restore(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @Body() dto: RestoreRevisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.statisticsService.restore(query.siteId, id, dto.revisionId, user.id);
  }

  @Post('reorder')
  async reorder(@Body() dto: ReorderStatisticDto, @CurrentUser() user: AuthenticatedUser) {
    await this.statisticsService.reorder(dto.siteId, dto.orderedIds, user.id);
    return { success: true };
  }
}
