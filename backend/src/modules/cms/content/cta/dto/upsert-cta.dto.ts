import { IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `CreateCtaDto` / `UpdateCtaDto` — CMS-D.3. Same shape
 * `CreateHeroDto`/`UpdateHeroDto` (CMS-D.1) and `CreateAboutDto`/
 * `UpdateAboutDto` (CMS-D.2) established: `siteId` required on create
 * and immutable after (updates scope via `SiteIdQueryDto`'s
 * `?siteId=`); `title`/`body`/`buttonLabel` are only shape-checked
 * (`@IsObject()`) here, matching every other `LocalizedText` field in
 * the module. No `coverMediaId` — CTA has no media reference.
 */
export class CreateCtaDto {
  @IsUUID()
  siteId: string;

  @IsObject()
  title: LocalizedText;

  @IsOptional()
  @IsObject()
  body?: LocalizedText;

  @IsOptional()
  @IsObject()
  buttonLabel?: LocalizedText;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  buttonUrl?: string;
}

export class UpdateCtaDto {
  @IsOptional()
  @IsObject()
  title?: LocalizedText;

  @IsOptional()
  @IsObject()
  body?: LocalizedText;

  @IsOptional()
  @IsObject()
  buttonLabel?: LocalizedText;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  buttonUrl?: string;
}
