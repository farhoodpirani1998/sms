import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { RevisionsService } from './revisions.service';
import { RestoreRevisionDto } from './dto/restore-revision.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { PermissionsGuard } from '../../../../common/authorization/permissions.guard';
import { RequirePermission } from '../../../../common/authorization/require-permission.decorator';
import { Permission } from '../../../../common/authorization/permissions';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';

/**
 * `GET /cms/:entityType/:id/revisions`, `POST .../restore` — CMS-C.2.
 * Generic across every CMS content type, keyed purely by the
 * `entityType`/`id` URL segments — this is the one controller CMS-D
 * through CMS-H's content types all share, instead of each getting its
 * own revisions endpoints.
 *
 * Same guard/permission composition as `SiteController`/`MediaController`:
 * `@Roles` is the coarse admin-or-staff gate, `@RequirePermission(
 * CMS_CONTENT_EDIT)` is the fine-grained one `PermissionsGuard` actually
 * enforces — restoring a revision is an edit, so it uses the same
 * permission as editing content itself, not `CMS_CONTENT_PUBLISH`.
 */
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('school_admin', 'staff')
@RequirePermission(Permission.CMS_CONTENT_EDIT)
@Controller('cms/:entityType/:id/revisions')
export class RevisionsController {
  constructor(private readonly revisionsService: RevisionsService) {}

  @Get()
  async list(@Param('entityType') entityType: string, @Param('id') id: string) {
    return this.revisionsService.list(entityType, id);
  }

  @Post('restore')
  async restore(
    @Param('entityType') entityType: string,
    @Param('id') id: string,
    @Body() dto: RestoreRevisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.revisionsService.restore(entityType, id, dto.revisionId, user.id);
  }
}
