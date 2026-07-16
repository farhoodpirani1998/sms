import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * `UploadMediaDto` — CMS-B.4. The endpoint is `multipart/form-data`
 * (the binary rides in the `file` field, handled separately by
 * `FileInterceptor`/`@UploadedFile()` in `MediaController`), so this DTO
 * only covers the metadata fields sent alongside it as regular form
 * fields.
 *
 * Deliberately does NOT include `originalFilename`, `mimeType`, or
 * `sizeBytes` — those are read off the uploaded file itself
 * (`Express.Multer.File`) in `MediaService.upload()`, never trusted from
 * client-supplied form fields (a caller could otherwise claim a `.pdf` is
 * an `.png`, or lie about size).
 */
export class UploadMediaDto {
  // Required so the upload can be key-namespaced `sites/{siteId}/...`
  // (docs/architecture/CMS_ARCHITECTURE.md §4.7) and the row's `siteId`
  // FK is known up front. Validated against `cms.sites` in the service
  // (SiteService.findOne — 404s the same way a bad id does anywhere else
  // in the CMS module), not just shape-checked here.
  @IsUUID()
  siteId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  altText?: string;
}
