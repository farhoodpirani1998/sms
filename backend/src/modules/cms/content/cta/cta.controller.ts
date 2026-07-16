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
import { CtaService } from './cta.service';
import { CreateCtaDto, UpdateCtaDto } from './dto/upsert-cta.dto';
import {
  CtaListQueryDto,
  ReorderCtaDto,
  ScheduleCtaDto,
  SiteIdQueryDto,
} from './dto/cta-query.dto';
import { RestoreRevisionDto } from '../../core/revisions/dto/restore-revision.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { PermissionsGuard } from '../../../../common/authorization/permissions.guard';
import { RequirePermission } from '../../../../common/authorization/require-permission.decorator';
import { Permission } from '../../../../common/authorization/permissions';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';

/**
 * `cms/cta` — CMS-D.3. Copies `HeroController` (CMS-D.1)/`AboutController`
 * (CMS-D.2) 1:1, swapping `Cta`/`cta` in. Same guard/permission
 * composition; revision list/restore go through the shared generic
 * `GET/POST /cms/cta/:id/revisions...` routes.
 */
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('school_admin', 'staff')
@RequirePermission(Permission.CMS_CONTENT_EDIT)
@Controller('cms/cta')
export class CtaController {
  constructor(private readonly ctaService: CtaService) {}

  @Post()
  async create(@Body() dto: CreateCtaDto, @CurrentUser() user: AuthenticatedUser) {
    const { siteId, ...data } = dto;
    return this.ctaService.create(siteId, data, user.id);
  }

  @Get()
  async findAll(@Query() query: CtaListQueryDto) {
    return this.ctaService.findAll(query.siteId, {
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query() query: SiteIdQueryDto) {
    return this.ctaService.findOne(query.siteId, id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @Body() dto: UpdateCtaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ctaService.update(query.siteId, id, dto, user.id);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.ctaService.remove(query.siteId, id, user.id);
    return { success: true };
  }

  @Post(':id/publish')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async publish(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ctaService.publish(query.siteId, id, user.id);
  }

  @Post(':id/unpublish')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async unpublish(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ctaService.unpublish(query.siteId, id, user.id);
  }

  @Post(':id/schedule')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async schedule(
    @Param('id') id: string,
    @Body() dto: ScheduleCtaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ctaService.schedule(dto.siteId, id, new Date(dto.scheduledAt), user.id);
  }

  @Post(':id/restore')
  async restore(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @Body() dto: RestoreRevisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ctaService.restore(query.siteId, id, dto.revisionId, user.id);
  }

  @Post('reorder')
  async reorder(@Body() dto: ReorderCtaDto, @CurrentUser() user: AuthenticatedUser) {
    await this.ctaService.reorder(dto.siteId, dto.orderedIds, user.id);
    return { success: true };
  }
}
