import { IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `CreateFeatureDto` / `UpdateFeatureDto` — CMS-D.5. Same shape every
 * prior CMS-D DTO pair established: `siteId` required on create and
 * immutable after (updates scope via `SiteIdQueryDto`'s `?siteId=`).
 * `title`/`description` are only shape-checked (`@IsObject()`), matching
 * every other `LocalizedText` field in the module. `icon` is a plain
 * string, same as `Statistic`'s. `coverMediaId`, if supplied, is only
 * UUID-shape-checked here — same "client supplies it, service validates
 * it" split Hero/About already use.
 */
export class CreateFeatureDto {
  @IsUUID()
  siteId: string;

  @IsObject()
  title: LocalizedText;

  @IsOptional()
  @IsObject()
  description?: LocalizedText;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @IsOptional()
  @IsUUID()
  coverMediaId?: string;
}

export class UpdateFeatureDto {
  @IsOptional()
  @IsObject()
  title?: LocalizedText;

  @IsOptional()
  @IsObject()
  description?: LocalizedText;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @IsOptional()
  @IsUUID()
  coverMediaId?: string;
}
