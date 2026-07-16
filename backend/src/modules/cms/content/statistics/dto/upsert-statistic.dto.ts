import { IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `CreateStatisticDto` / `UpdateStatisticDto` — CMS-D.4. Same shape
 * every prior CMS-D DTO pair established: `siteId` required on create
 * and immutable after (updates scope via `SiteIdQueryDto`'s `?siteId=`).
 * `label` is only shape-checked (`@IsObject()`), matching every other
 * `LocalizedText` field in the module. `value` and `icon` are plain
 * strings (not `LocalizedText`) since neither is translated — see the
 * entity's doc comment.
 */
export class CreateStatisticDto {
  @IsUUID()
  siteId: string;

  @IsObject()
  label: LocalizedText;

  @IsString()
  @MaxLength(50)
  value: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;
}

export class UpdateStatisticDto {
  @IsOptional()
  @IsObject()
  label?: LocalizedText;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  value?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;
}
