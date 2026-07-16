import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { UploadMediaDto } from './dto/upload-media.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { PermissionsGuard } from '../../../../common/authorization/permissions.guard';
import { RequirePermission } from '../../../../common/authorization/require-permission.decorator';
import { Permission } from '../../../../common/authorization/permissions';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';

// Generous but bounded — big enough for the images/PDFs editors actually
// attach to content, small enough that a single request can't tie up the
// process buffering an enormous body (FileInterceptor with no `storage`
// option keeps the upload in memory, per MediaService's use of
// `file.buffer`; see storage-provider.interface.ts for why StorageProvider
// itself stays Buffer-based rather than streaming).
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * `POST /cms/media` — CMS-B.4. Same guard/permission composition as
 * `SiteController`: `@Roles` is the coarse "must be admin or staff at
 * all" gate, `@RequirePermission(CMS_MEDIA_MANAGE)` is the fine-grained
 * one PermissionsGuard actually enforces (permissions.ts grants
 * CMS_MEDIA_MANAGE to both school_admin and staff, so the two guards
 * agree today).
 *
 * No public/read endpoints here — reading a `MediaAsset` back happens by
 * following its `url` directly (or, for content types, indirectly via a
 * stored `coverMediaId`), not through this controller.
 */
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('school_admin', 'staff')
@RequirePermission(Permission.CMS_MEDIA_MANAGE)
@Controller('cms/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.mediaService.upload(file, dto, user.id);
  }
}
