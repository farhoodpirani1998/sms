import { Body, Controller, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import {
  RestoreSiteSettingsDto,
  ScheduleSiteSettingsDto,
  SiteIdQueryDto,
} from './dto/update-site-settings.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { PermissionsGuard } from '../../../../common/authorization/permissions.guard';
import { RequirePermission } from '../../../../common/authorization/require-permission.decorator';
import { Permission } from '../../../../common/authorization/permissions';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';

/**
 * `cms/site-settings` — CMS-E.1. Same guard/permission composition
 * every CMS-D controller uses, but no `:id` route params anywhere —
 * every route is scoped by `?siteId=` alone, and `SiteSettingsService`
 * resolves the singleton row's `id` internally via `getOrCreate()`.
 * There's no `POST` create route (unlike CMS-D's `create()`/`@Post()`)
 * and no `reorder()` route — neither makes sense for a singleton.
 *
 * Revision list/restore go through the shared generic
 * `GET/POST /cms/site-settings/:id/revisions...` routes once the
 * client has the row's id from a prior `GET`, same as every CMS-D type;
 * this controller's own `restore` route additionally exists (mirroring
 * Hero/About/etc.'s own `:id/restore`) but needs no `:id` since it
 * resolves the row itself.
 */
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('school_admin', 'staff')
@RequirePermission(Permission.CMS_CONTENT_EDIT)
@Controller('cms/site-settings')
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get()
  async find(@Query() query: SiteIdQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.siteSettingsService.getOrCreate(query.siteId, user.id);
  }

  @Patch()
  async update(
    @Query() query: SiteIdQueryDto,
    @Body() dto: UpdateSiteSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.siteSettingsService.updateSettings(query.siteId, dto, user.id);
  }

  @Post('publish')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async publish(@Query() query: SiteIdQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.siteSettingsService.publish(query.siteId, user.id);
  }

  @Post('unpublish')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async unpublish(@Query() query: SiteIdQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.siteSettingsService.unpublish(query.siteId, user.id);
  }

  @Post('schedule')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async schedule(@Body() dto: ScheduleSiteSettingsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.siteSettingsService.schedule(dto.siteId, new Date(dto.scheduledAt), user.id);
  }

  @Post('restore')
  async restore(@Body() dto: RestoreSiteSettingsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.siteSettingsService.restore(dto.siteId, dto.revisionId, user.id);
  }
}
