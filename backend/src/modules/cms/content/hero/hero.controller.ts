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
import { HeroService } from './hero.service';
import { CreateHeroDto, UpdateHeroDto } from './dto/upsert-hero.dto';
import {
  HeroListQueryDto,
  ReorderHeroDto,
  ScheduleHeroDto,
  SiteIdQueryDto,
} from './dto/hero-query.dto';
import { RestoreRevisionDto } from '../../core/revisions/dto/restore-revision.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { PermissionsGuard } from '../../../../common/authorization/permissions.guard';
import { RequirePermission } from '../../../../common/authorization/require-permission.decorator';
import { Permission } from '../../../../common/authorization/permissions';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';

/**
 * `cms/hero` — CMS-D.1. Admin-only controller, same guard/permission
 * composition and route shape `ProofBlockController` (CMS-C.5) proved
 * end-to-end: `@Roles` is the coarse admin-or-staff gate,
 * `@RequirePermission` is the fine-grained one `PermissionsGuard`
 * enforces. CRUD defaults to `CMS_CONTENT_EDIT` (school_admin + staff);
 * `publish`/`unpublish`/`schedule` override that at the method level to
 * `CMS_CONTENT_PUBLISH` (school_admin only). Revision list/restore for
 * Hero go through the shared, entity-type-generic
 * `GET/POST /cms/hero/:id/revisions...` routes `RevisionsController`
 * (CMS-C.2) already exposes — no Hero-specific revisions endpoint here.
 *
 * This is the reference implementation: D.2–D.6 copy this file 1:1,
 * swapping `Hero`/`hero` for their own type/route segment.
 */
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('school_admin', 'staff')
@RequirePermission(Permission.CMS_CONTENT_EDIT)
@Controller('cms/hero')
export class HeroController {
  constructor(private readonly heroService: HeroService) {}

  @Post()
  async create(@Body() dto: CreateHeroDto, @CurrentUser() user: AuthenticatedUser) {
    const { siteId, ...data } = dto;
    return this.heroService.create(siteId, data, user.id);
  }

  @Get()
  async findAll(@Query() query: HeroListQueryDto) {
    return this.heroService.findAll(query.siteId, {
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query() query: SiteIdQueryDto) {
    return this.heroService.findOne(query.siteId, id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @Body() dto: UpdateHeroDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.heroService.update(query.siteId, id, dto, user.id);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.heroService.remove(query.siteId, id, user.id);
    return { success: true };
  }

  @Post(':id/publish')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async publish(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.heroService.publish(query.siteId, id, user.id);
  }

  @Post(':id/unpublish')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async unpublish(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.heroService.unpublish(query.siteId, id, user.id);
  }

  @Post(':id/schedule')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async schedule(
    @Param('id') id: string,
    @Body() dto: ScheduleHeroDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.heroService.schedule(dto.siteId, id, new Date(dto.scheduledAt), user.id);
  }

  @Post(':id/restore')
  async restore(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @Body() dto: RestoreRevisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.heroService.restore(query.siteId, id, dto.revisionId, user.id);
  }

  @Post('reorder')
  async reorder(@Body() dto: ReorderHeroDto, @CurrentUser() user: AuthenticatedUser) {
    await this.heroService.reorder(dto.siteId, dto.orderedIds, user.id);
    return { success: true };
  }
}
