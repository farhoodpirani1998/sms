import { IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `CreateHeroDto` / `UpdateHeroDto` — CMS-D.1. Same shape
 * `CreateProofBlockDto`/`UpdateProofBlockDto` (CMS-C.5) established:
 * `siteId` is required on create and immutable after (an update's target
 * Site comes from `SiteIdQueryDto`'s `?siteId=`, alongside `:id`,
 * matching every other single-record admin action on this controller).
 *
 * `title`/`subtitle`/`ctaLabel` are only shape-checked here
 * (`@IsObject()` — a `LocalizedText` is just `Record<string, string>`);
 * validating that keys are real locale codes for the target Site is
 * `LocaleResolverService`'s concern, not this DTO's (same division
 * `ProofBlock`'s DTO doc comment draws).
 *
 * `coverMediaId`, if supplied, is only checked for UUID shape here —
 * confirming the referenced `MediaAsset` actually exists (and belongs
 * to the same Site) is `HeroService`'s job, the same "client supplies
 * it, service validates it" split `UploadMediaDto`/`MediaService`
 * already established for `siteId` itself.
 */
export class CreateHeroDto {
  @IsUUID()
  siteId: string;

  @IsObject()
  title: LocalizedText;

  @IsOptional()
  @IsObject()
  subtitle?: LocalizedText;

  @IsOptional()
  @IsObject()
  ctaLabel?: LocalizedText;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  ctaUrl?: string;

  @IsOptional()
  @IsUUID()
  coverMediaId?: string;
}

export class UpdateHeroDto {
  @IsOptional()
  @IsObject()
  title?: LocalizedText;

  @IsOptional()
  @IsObject()
  subtitle?: LocalizedText;

  @IsOptional()
  @IsObject()
  ctaLabel?: LocalizedText;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  ctaUrl?: string;

  @IsOptional()
  @IsUUID()
  coverMediaId?: string;
}
