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
import { ProofBlockService } from './proof-block.service';
import { CreateProofBlockDto, UpdateProofBlockDto } from './dto/upsert-proof-block.dto';
import {
  ProofBlockListQueryDto,
  ReorderProofBlocksDto,
  ScheduleProofBlockDto,
  SiteIdQueryDto,
} from './dto/proof-block-query.dto';
import { RestoreRevisionDto } from '../../core/revisions/dto/restore-revision.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { PermissionsGuard } from '../../../../common/authorization/permissions.guard';
import { RequirePermission } from '../../../../common/authorization/require-permission.decorator';
import { Permission } from '../../../../common/authorization/permissions';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';

/**
 * `cms/proof-blocks` — CMS-C.5. Admin-only controller proving the whole
 * `content/*` shape (CMS-D onward will copy this file 1:1) works over
 * real HTTP: create → edit → publish → revision-restore, plus reorder.
 * No public controller — a throwaway proof entity has no public-facing
 * use, unlike every real content type from CMS-D onward.
 *
 * Same guard/permission composition as `SiteController`/`MediaController`/
 * `RevisionsController`: `@Roles` is the coarse gate, `@RequirePermission`
 * is the fine-grained one `PermissionsGuard` enforces. CRUD defaults to
 * `CMS_CONTENT_EDIT` (school_admin and staff both hold it); `publish`/
 * `unpublish`/`schedule` override that at the method level to
 * `CMS_CONTENT_PUBLISH` (school_admin only — per permissions.ts, drafts
 * need admin sign-off to go live). `PermissionsGuard.canActivate()` uses
 * `getAllAndOverride`, so the method-level decorator wins over the
 * class-level default exactly where that distinction matters.
 */
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('school_admin', 'staff')
@RequirePermission(Permission.CMS_CONTENT_EDIT)
@Controller('cms/proof-blocks')
export class ProofBlockController {
  constructor(private readonly proofBlockService: ProofBlockService) {}

  @Post()
  async create(@Body() dto: CreateProofBlockDto, @CurrentUser() user: AuthenticatedUser) {
    const { siteId, ...data } = dto;
    return this.proofBlockService.create(siteId, data, user.id);
  }

  @Get()
  async findAll(@Query() query: ProofBlockListQueryDto) {
    return this.proofBlockService.findAll(query.siteId, {
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query() query: SiteIdQueryDto) {
    return this.proofBlockService.findOne(query.siteId, id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @Body() dto: UpdateProofBlockDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.proofBlockService.update(query.siteId, id, dto, user.id);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.proofBlockService.remove(query.siteId, id, user.id);
    return { success: true };
  }

  @Post(':id/publish')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async publish(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.proofBlockService.publish(query.siteId, id, user.id);
  }

  @Post(':id/unpublish')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async unpublish(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.proofBlockService.unpublish(query.siteId, id, user.id);
  }

  @Post(':id/schedule')
  @RequirePermission(Permission.CMS_CONTENT_PUBLISH)
  async schedule(@Param('id') id: string, @Body() dto: ScheduleProofBlockDto, @CurrentUser() user: AuthenticatedUser) {
    return this.proofBlockService.schedule(dto.siteId, id, new Date(dto.scheduledAt), user.id);
  }

  @Post(':id/restore')
  async restore(
    @Param('id') id: string,
    @Query() query: SiteIdQueryDto,
    @Body() dto: RestoreRevisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.proofBlockService.restore(query.siteId, id, dto.revisionId, user.id);
  }

  @Post('reorder')
  async reorder(@Body() dto: ReorderProofBlocksDto, @CurrentUser() user: AuthenticatedUser) {
    await this.proofBlockService.reorder(dto.siteId, dto.orderedIds, user.id);
    return { success: true };
  }
}
