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
import { NavigationService } from './navigation.service';
import {
  CreateNavigationItemDto,
  UpdateNavigationItemDto,
} from './dto/upsert-navigation-item.dto';
import {
  NavigationItemListQueryDto,
  ReorderNavigationItemsDto,
  ReparentNavigationItemDto,
  ScheduleNavigationItemDto,
  SiteIdQueryDto,
} from './dto/navigation-item-query.dto';
import { RestoreRevisionDto } from '../../core/revisions/dto/restore-revision.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { PermissionsGuard } from '../../../../common/authorization/permissions.guard';
import { RequirePermission } from '../../../../common/authorization/require-permission.decorator';
import { Permission } from '../../../../common/authorization/permissions';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';

/**
 * `cms/navigation` — CMS-E.2. Same guard/permission composition as
 * every other admin content controller (`StatisticsController`, etc);
 * revision list/restore go through the shared generic
 * `GET/POST /cms/navigation/:id/revisions...` routes. Two routes here
 * have no equivalent in a CMS-D controller: `reorder` takes an optional
 * `parentId` scope, and `reparent` moves a row to a different parent.
 */
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('school_admin', 'staff')
@RequirePermission(Permission.CMS_CONTENT_EDIT)
@Controller('cms/navigation')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  @Post()
  async create(@Body() dto: CreateNavigationItemDto, @CurrentUser() user: AuthenticatedUser) {
    const { siteId, ...data } = dto;
    return this.navigationService.create(siteId, data, user.id);
  }

  @Get()
  async findAll(@Query() query: NavigationItemListQueryDto) {
    return this.navigationService.findAll(query.siteId, {
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query() query: SiteIdQueryDto) {
    return this.navigationService.findOne(query.siteId, id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @Body() dto: UpdateNavigationItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.navigationService.update(query.siteId, id, dto, user.id);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.navigationService.remove(query.siteId, id, user.id);
    return { success: true };
  }

  @Post(':id/publish')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async publish(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.navigationService.publish(query.siteId, id, user.id);
  }

  @Post(':id/unpublish')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async unpublish(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.navigationService.unpublish(query.siteId, id, user.id);
  }

  @Post(':id/schedule')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async schedule(
    @Param('id') id: string,
    @Body() dto: ScheduleNavigationItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.navigationService.schedule(dto.siteId, id, new Date(dto.scheduledAt), user.id);
  }

  @Post(':id/restore')
  async restore(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @Body() dto: RestoreRevisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.navigationService.restore(query.siteId, id, dto.revisionId, user.id);
  }

  @Post('reorder')
  async reorder(@Body() dto: ReorderNavigationItemsDto, @CurrentUser() user: AuthenticatedUser) {
    await this.navigationService.reorder(dto.siteId, dto.parentId ?? null, dto.orderedIds, user.id);
    return { success: true };
  }

  @Post(':id/reparent')
  async reparent(
    @Param('id') id: string,
    @Body() dto: ReparentNavigationItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.navigationService.reparent(dto.siteId, id, dto.parentId ?? null, user.id);
  }
}
