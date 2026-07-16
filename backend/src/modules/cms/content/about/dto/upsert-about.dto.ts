import { IsObject, IsOptional, IsUUID } from 'class-validator';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `CreateAboutDto` / `UpdateAboutDto` — CMS-D.2. Same shape
 * `CreateHeroDto`/`UpdateHeroDto` (CMS-D.1) established: `siteId`
 * required on create and immutable after (updates scope via
 * `SiteIdQueryDto`'s `?siteId=`); `title`/`body` are only shape-checked
 * (`@IsObject()`) here, matching every other `LocalizedText` field in
 * the module; `coverMediaId`, if supplied, is only UUID-shape-checked
 * here, same "client supplies it, service validates existence" split.
 */
export class CreateAboutDto {
  @IsUUID()
  siteId: string;

  @IsObject()
  title: LocalizedText;

  @IsOptional()
  @IsObject()
  body?: LocalizedText;

  @IsOptional()
  @IsUUID()
  coverMediaId?: string;
}

export class UpdateAboutDto {
  @IsOptional()
  @IsObject()
  title?: LocalizedText;

  @IsOptional()
  @IsObject()
  body?: LocalizedText;

  @IsOptional()
  @IsUUID()
  coverMediaId?: string;
}
