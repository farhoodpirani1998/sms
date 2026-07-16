import { IsObject, IsOptional, IsUUID } from 'class-validator';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `CreateProofBlockDto` / `UpdateProofBlockDto` — CMS-C.5.
 *
 * `siteId` is required on create (same "client supplies it, service
 * validates it exists via `SiteService.findOne`" shape `UploadMediaDto`
 * — CMS-B.4 — already established) since `Site` carries no auth/tenant
 * semantics a request could derive it from (see `Site` entity's doc
 * comment). It's immutable after creation, so `UpdateProofBlockDto` has
 * no `siteId` field — the target Site for an update instead comes from
 * `SiteIdQueryDto` (`?siteId=`) alongside the `:id` route param, the
 * same way every other single-record admin action on this controller is
 * scoped.
 *
 * `title`/`body` are only shape-checked here (`@IsObject()` — a
 * `LocalizedText` is just `Record<string, string>`); validating that
 * keys are real locale codes for the target `Site` is
 * `LocaleResolverService`'s concern (CMS-C.3), not this DTO's, matching
 * `LocaleQueryDto`'s own "purely a shape check" doc comment.
 */
export class CreateProofBlockDto {
  @IsUUID()
  siteId: string;

  @IsObject()
  title: LocalizedText;

  @IsOptional()
  @IsObject()
  body?: LocalizedText;
}

export class UpdateProofBlockDto {
  @IsOptional()
  @IsObject()
  title?: LocalizedText;

  @IsOptional()
  @IsObject()
  body?: LocalizedText;
}
